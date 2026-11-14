import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'

import {
  errorEnvelope,
  http,
  json,
  mountSetup,
  noContent,
  ORIGIN,
  resetAll,
  sent,
  server,
  settleQueries,
  signIn,
} from '../__tests__/harness'
import { useNotifications, useUnreadNotifications } from './queries'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useRegisterPushTarget,
  useUnregisterPushTarget,
} from './writes'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())
beforeEach(signIn)

const row = (id: string, read: boolean) => ({
  id,
  type: 'work.item.created',
  subject_ref: { kind: 'work_item', id: `w-${id}` },
  is_read: read,
  created_at: '2026-11-14T08:00:00Z',
})

/** Sunucu durumu: okunmamış kümesi; okundu yazması onu azaltır. */
function fakeServer() {
  const unread = new Set(['1', '2', '3'])
  server.use(
    http.get(`${ORIGIN}/v1/notifications/unread-count`, () => json({ count: unread.size })),
    http.get(`${ORIGIN}/v1/notifications`, () =>
      json({
        items: ['1', '2', '3'].map((id) => row(id, !unread.has(id))),
        unread_count: unread.size,
      }),
    ),
    http.post(`${ORIGIN}/v1/notifications/:id/read`, ({ params }) => {
      unread.delete(String(params.id))
      return noContent()
    }),
    http.post(`${ORIGIN}/v1/notifications/read-all`, () => {
      const marked = unread.size
      unread.clear()
      return json({ marked_count: marked })
    }),
  )
  return unread
}

function mountAll() {
  return mountSetup(() => ({
    count: useUnreadNotifications(),
    list: useNotifications(true),
    read: useMarkNotificationRead(),
    readAll: useMarkAllNotificationsRead(),
  }))
}

describe('markNotificationRead', () => {
  it('204: sayaç + panel listesi BİRLİKTE yenilenir (KESİN 29); Idempotency-Key yok, CSRF var', async () => {
    fakeServer()
    const m = mountAll()
    await settleQueries(m.client)
    expect(m.result.count.count.value).toBe(3)
    const outcome = await m.result.read.submit({ id: '2' })
    expect(outcome.kind).toBe('success')
    await settleQueries(m.client)
    expect(m.result.count.count.value).toBe(2)
    expect(m.result.list.unreadCount.value).toBe(2)
    expect(m.result.list.items.value.find((n) => n.id === '2')!.is_read).toBe(true)
    const call = sent('POST', '/v1/notifications/2/read')[0]!
    expect(call.headers.get('Idempotency-Key')).toBeNull()
    expect(call.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(call.headers.get('X-Nizamio-Program')).toBeNull()
  })

  it('iyimser güncelleme yok: yanıt gelmeden sayaç düşmez', async () => {
    fakeServer()
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.post(`${ORIGIN}/v1/notifications/:id/read`, async () => {
        await gate
        return noContent()
      }),
    )
    const m = mountAll()
    await settleQueries(m.client)
    const pending = m.result.read.submit({ id: '1' })
    await Promise.resolve()
    expect(m.result.count.count.value).toBe(3)
    expect(m.result.list.items.value.find((n) => n.id === '1')!.is_read).toBe(false)
    release()
    await pending
  })

  it('404 notification_not_found: sonuç failed ama liste ve sayaç yine yenilenir (satır düşer)', async () => {
    const unread = fakeServer()
    server.use(
      http.post(`${ORIGIN}/v1/notifications/:id/read`, () => {
        unread.delete('3')
        return errorEnvelope('notifications.notification_not_found', 404)
      }),
    )
    const m = mountAll()
    await settleQueries(m.client)
    const outcome = await m.result.read.submit({ id: '3' })
    expect(outcome).toMatchObject({ kind: 'failed' })
    await settleQueries(m.client)
    expect(m.result.count.count.value).toBe(2)
    expect(m.result.list.items.value.find((n) => n.id === '3')!.is_read).toBe(true)
  })

  it('ağ hatası: sonuç bilinmiyor; sayaç değişmez', async () => {
    fakeServer()
    server.use(http.post(`${ORIGIN}/v1/notifications/:id/read`, () => Response.error()))
    const m = mountAll()
    await settleQueries(m.client)
    const outcome = await m.result.read.submit({ id: '1' })
    expect(outcome.kind).toBe('unknown_outcome')
    expect(m.result.count.count.value).toBe(3)
  })
})

describe('markAllNotificationsRead', () => {
  it('marked_count döner; sayaç 0, liste yenilenir; ikinci çağrı 0 (idempotent)', async () => {
    fakeServer()
    const m = mountAll()
    await settleQueries(m.client)
    const first = await m.result.readAll.submit()
    expect(first).toMatchObject({ kind: 'success', data: { marked_count: 3 } })
    await settleQueries(m.client)
    expect(m.result.count.count.value).toBe(0)
    expect(m.client.getQueryState(queryKeys.notifications.list())?.isInvalidated).toBe(false)
    const second = await m.result.readAll.submit()
    expect(second).toMatchObject({ kind: 'success', data: { marked_count: 0 } })
  })

  it('salt okunur kurulum (409 provisioning.write_not_allowed): failed, sayaç korunur', async () => {
    fakeServer()
    server.use(
      http.post(`${ORIGIN}/v1/notifications/read-all`, () =>
        errorEnvelope('provisioning.write_not_allowed', 409),
      ),
    )
    const m = mountAll()
    await settleQueries(m.client)
    const outcome = await m.result.readAll.submit()
    expect(outcome).toMatchObject({ kind: 'failed' })
    expect(m.result.count.count.value).toBe(3)
  })
})

describe('Web Push cihaz kaydı (yalnız api katmanı; arayüz W159)', () => {
  it('registerPushTarget gövdeyi aynen yollar; okuma sorgusu geçersizlemez', async () => {
    let body: unknown = null
    server.use(
      http.post(`${ORIGIN}/v1/notifications/targets`, async ({ request }) => {
        body = await request.json()
        return json({ target_id: 't-1', status: 'active' })
      }),
    )
    const m = mountSetup(() => ({ reg: useRegisterPushTarget(), count: useUnreadNotifications() }))
    server.use(http.get(`${ORIGIN}/v1/notifications/unread-count`, () => json({ count: 1 })))
    await settleQueries(m.client)
    const before = sent('GET', '/v1/notifications/unread-count').length
    const out = await m.result.reg.submit({
      endpoint: 'https://fcm.googleapis.com/x',
      keys: { p256dh: 'AAA', auth: 'BBB' },
      user_agent: 'ua',
    })
    expect(out).toMatchObject({ kind: 'success', data: { target_id: 't-1' } })
    expect(body).toEqual({
      endpoint: 'https://fcm.googleapis.com/x',
      keys: { p256dh: 'AAA', auth: 'BBB' },
      user_agent: 'ua',
    })
    expect(sent('GET', '/v1/notifications/unread-count')).toHaveLength(before)
    expect(sent('POST', '/v1/notifications/targets')[0]!.headers.get('X-Requested-With')).toBe(
      'XMLHttpRequest',
    )
  })

  it('409 subscription_owner_conflict ve 422 target_invalid sonuç olarak döner (fırlatılmaz)', async () => {
    const m = mountSetup(() => useRegisterPushTarget())
    const request = {
      endpoint: 'https://fcm.googleapis.com/x',
      keys: { p256dh: 'A', auth: 'B' },
    }
    server.use(
      http.post(`${ORIGIN}/v1/notifications/targets`, () =>
        errorEnvelope('notifications.subscription_owner_conflict', 409),
      ),
    )
    const conflict = await m.result.submit(request)
    expect(conflict).toMatchObject({
      kind: 'failed',
      error: { code: 'notifications.subscription_owner_conflict' },
    })
    server.use(
      http.post(`${ORIGIN}/v1/notifications/targets`, () =>
        errorEnvelope('notifications.target_invalid', 422),
      ),
    )
    const invalid = await m.result.submit(request)
    expect(invalid).toMatchObject({
      kind: 'failed',
      error: { code: 'notifications.target_invalid' },
    })
  })

  it('unregisterPushTarget DELETE /targets/{id}', async () => {
    server.use(http.delete(`${ORIGIN}/v1/notifications/targets/:id`, () => noContent()))
    const m = mountSetup(() => useUnregisterPushTarget())
    const out = await m.result.submit({ targetId: 't-9' })
    expect(out.kind).toBe('success')
    expect(sent('DELETE', '/v1/notifications/targets/t-9')).toHaveLength(1)
  })
})
