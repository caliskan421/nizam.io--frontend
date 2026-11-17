// W185: S1 yazmaları kapsamsız eylem; kaldır, sessize al/geri al (BE-156).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { makeNotification } from '@/shared/api/__tests__/defaults'
import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

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
import { useNotifications, useSubjectMutes, useUnreadNotifications } from './queries'
import {
  useDismissNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMuteNotificationSubject,
  useUnmuteNotificationSubject,
} from './writes'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())
beforeEach(signIn)

const row = (id: string, read: boolean) =>
  makeNotification({
    id,
    subject_ref: { kind: 'work_item', id: `w-${id}` },
    is_read: read,
    created_at: '2026-11-14T08:00:00Z',
  })

/** Sunucu durumu: okunmamış kümesi; okundu yazması onu azaltır. */
function fakeServer() {
  const unread = new Set(['1', '2', '3'])
  server.use(
    http.get(`${ORIGIN}/v1/notifications/unread-count`, () =>
      json({ count: unread.size, awaiting_count: 0 }),
    ),
    http.get(`${ORIGIN}/v1/notifications`, () =>
      json({
        items: ['1', '2', '3'].map((id) => row(id, !unread.has(id))),
        awaiting_count: 0,
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

describe('S1 yazmaları kapsam değişiminden etkilenmez (çaprazprogram gezinmesi)', () => {
  it('okundu/kaldır/sessize al: gönderim anında program değişse de `scope_changed` YOK, istek gider; çıkış gönderimi durdurur', async () => {
    fakeServer()
    server.use(
      http.delete(`${ORIGIN}/v1/notifications/:id`, () => noContent()),
      http.put(`${ORIGIN}/v1/notifications/subject-mutes/:kind/:id`, () => noContent()),
    )
    const m = mountSetup(() => ({
      read: useMarkNotificationRead(),
      dismiss: useDismissNotification(),
      mute: useMuteNotificationSubject(),
      readAll: useMarkAllNotificationsRead(),
    }))
    const store = useScopeStore()
    store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    const pending = [
      m.result.read.submit({ id: '1' }),
      m.result.dismiss.submit({ id: '2' }),
      m.result.mute.submit({ kind: 'work_item', id: 'w-1' }),
      m.result.readAll.submit(),
    ]
    store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    expect((await Promise.all(pending)).map((o) => o.kind)).toEqual([
      'success',
      'success',
      'success',
      'success',
    ])
    const afterSignOut = m.result.read.submit({ id: '3' })
    authSession.clear()
    expect((await afterSignOut).kind).not.toBe('success')
    expect(sent('POST', '/v1/notifications/3/read')).toHaveLength(0)
  })
})

describe('dismissNotification (BE-156)', () => {
  it('204: sayaç + liste birlikte yenilenir; CSRF var, Idempotency-Key yok', async () => {
    const unread = fakeServer()
    server.use(
      http.delete(`${ORIGIN}/v1/notifications/:id`, ({ params }) => {
        unread.delete(String(params.id))
        return noContent()
      }),
    )
    const m = mountSetup(() => ({
      count: useUnreadNotifications(),
      list: useNotifications(true),
      dismiss: useDismissNotification(),
    }))
    await settleQueries(m.client)
    expect(m.result.count.count.value).toBe(3)
    expect((await m.result.dismiss.submit({ id: '2' })).kind).toBe('success')
    await settleQueries(m.client)
    expect(m.result.count.count.value).toBe(2)
    const call = sent('DELETE', '/v1/notifications/2')[0]!
    expect(call.headers.get('X-Requested-With')).toBeTruthy()
    expect(call.headers.get('Idempotency-Key')).toBeNull()
  })

  it('404 (başkasının/olmayan): sessiz failed; liste ve sayaç yine yeniden okunur', async () => {
    fakeServer()
    server.use(
      http.delete(`${ORIGIN}/v1/notifications/:id`, () =>
        errorEnvelope('notifications.notification_not_found', 404),
      ),
    )
    const m = mountSetup(() => ({
      list: useNotifications(true),
      dismiss: useDismissNotification(),
    }))
    await settleQueries(m.client)
    const before = sent('GET', '/v1/notifications').length
    const outcome = await m.result.dismiss.submit({ id: 'x' })
    expect(outcome.kind).toBe('failed')
    await settleQueries(m.client)
    expect(sent('GET', '/v1/notifications').length).toBeGreaterThan(before)
  })
})

describe('muteNotificationSubject / unmuteNotificationSubject (BE-156)', () => {
  function muteServer() {
    const muted = new Map<string, string>()
    server.use(
      http.get(`${ORIGIN}/v1/notifications/subject-mutes`, () =>
        json({
          items: [...muted.entries()].map(([key, created_at]) => {
            const [subject_kind, subject_id] = key.split('/')
            return { subject_kind, subject_id, created_at }
          }),
          next_cursor: null,
        }),
      ),
      http.put(`${ORIGIN}/v1/notifications/subject-mutes/:kind/:id`, ({ params }) => {
        muted.set(`${String(params.kind)}/${String(params.id)}`, '2026-11-14T08:00:00Z')
        return noContent()
      }),
      http.delete(`${ORIGIN}/v1/notifications/subject-mutes/:kind/:id`, ({ params }) => {
        muted.delete(`${String(params.kind)}/${String(params.id)}`)
        return noContent()
      }),
    )
    return muted
  }

  it('mute → liste + iki sayaç + mute listesi yenilenir; idempotent tekrar; unmute geri alır', async () => {
    fakeServer()
    const muted = muteServer()
    const m = mountSetup(() => ({
      count: useUnreadNotifications(),
      list: useNotifications(true),
      mutes: useSubjectMutes(true),
      mute: useMuteNotificationSubject(),
      unmute: useUnmuteNotificationSubject(),
    }))
    await settleQueries(m.client)
    const reads = () => sent('GET', '/v1/notifications/unread-count').length
    const before = reads()
    expect((await m.result.mute.submit({ kind: 'work_item', id: 'w-1' })).kind).toBe('success')
    await settleQueries(m.client)
    expect(reads()).toBeGreaterThan(before)
    expect(m.result.mutes.items.value.map((x) => x.subject_id)).toEqual(['w-1'])
    expect((await m.result.mute.submit({ kind: 'work_item', id: 'w-1' })).kind).toBe('success')
    expect(muted.size).toBe(1)
    expect(
      sent('PUT', '/v1/notifications/subject-mutes/work_item/w-1')[0]!.headers.get(
        'X-Requested-With',
      ),
    ).toBeTruthy()
    expect((await m.result.unmute.submit({ kind: 'work_item', id: 'w-1' })).kind).toBe('success')
    await settleQueries(m.client)
    expect(m.result.mutes.items.value).toEqual([])
    // Satır yokken de 204: ikinci kaldırma başarıdır.
    expect((await m.result.unmute.submit({ kind: 'work_item', id: 'w-1' })).kind).toBe('success')
  })

  it('500 konu tavanı: 422 subject_id failed olarak döner (kısmi/iyimser durum yok)', async () => {
    server.use(
      http.put(`${ORIGIN}/v1/notifications/subject-mutes/:kind/:id`, () =>
        errorEnvelope('notifications.input_invalid', 422, [
          { field: 'subject_id', code: 'notifications.input_invalid' },
        ]),
      ),
    )
    const m = mountSetup(() => useMuteNotificationSubject())
    const outcome = await m.result.submit({ kind: 'meeting', id: 'm-1' })
    expect(outcome.kind).toBe('failed')
    if (outcome.kind === 'failed') {
      expect(outcome.error.status).toBe(422)
      expect(outcome.error.fields.map((f) => f.field)).toContain('subject_id')
    }
  })
})
