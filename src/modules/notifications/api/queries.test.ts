import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { authSession } from '@/shared/http'
import { makeNotification } from '@/shared/api/__tests__/defaults'
import { queryKeys } from '@/shared/http/query-keys'

import {
  errorEnvelope,
  http,
  json,
  mountSetup,
  ORIGIN,
  resetAll,
  sent,
  server,
  settleQueries,
  signIn,
} from '../__tests__/harness'
import { useNotifications, usePushPublicKey, useUnreadNotifications } from './queries'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())
beforeEach(signIn)

const item = (id: string, read = false) =>
  makeNotification({
    id,
    subject_ref: { kind: 'work_item', id: `w-${id}` },
    is_read: read,
    created_at: '2026-11-14T08:00:00Z',
  })

describe('useUnreadNotifications', () => {
  it('hesap geneli anahtarla sayacı okur; kapsam başlığı gitmez', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/notifications/unread-count`, () =>
        json({ count: 4, awaiting_count: 7 }),
      ),
    )
    const m = mountSetup(() => useUnreadNotifications())
    await settleQueries(m.client)
    // Zil sayısı (okunmamış GRUP) ve "Senden bekleyen" iki AYRI sayıdır.
    expect(m.result.count.value).toBe(4)
    expect(m.result.awaitingCount.value).toBe(7)
    expect(m.client.getQueryData(queryKeys.notifications.unreadCount())).toEqual({
      count: 4,
      awaiting_count: 7,
    })
    const call = sent('GET', '/v1/notifications/unread-count')[0]!
    expect(call.headers.get('X-Nizamio-Program')).toBeNull()
    expect(call.headers.get('Authorization')).toBe('Bearer tok-1')
  })

  it('hata → null (rozet gizli, zil açık)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/notifications/unread-count`, () =>
        errorEnvelope('platform.internal', 400),
      ),
    )
    const m = mountSetup(() => useUnreadNotifications())
    await settleQueries(m.client)
    expect(m.result.count.value).toBeNull()
  })

  it('oturum yokken istek yok', async () => {
    authSession.clear()
    const m = mountSetup(() => useUnreadNotifications())
    await settleQueries(m.client)
    expect(sent('GET', '/v1/notifications/unread-count')).toHaveLength(0)
  })

  it('geç yanıt: oturum okuma sırasında değişirse veri önbelleğe yazılmaz (sessionBound)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/notifications/unread-count`, () => {
        authSession.clear()
        return json({ count: 9, awaiting_count: 0 })
      }),
    )
    const m = mountSetup(() => useUnreadNotifications())
    await settleQueries(m.client).catch(() => undefined)
    expect(m.client.getQueryData(queryKeys.notifications.unreadCount())).toBeUndefined()
  })
})

describe('useNotifications', () => {
  it('panel kapalıyken okunmaz; açılınca limit=30 ile ilk sayfa, sunucu sayacı', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/notifications`, () =>
        json({ items: [item('1'), item('2', true)], awaiting_count: 0, unread_count: 7 }),
      ),
    )
    const open = ref(false)
    const m = mountSetup(() => useNotifications(open))
    await settleQueries(m.client)
    expect(sent('GET', '/v1/notifications')).toHaveLength(0)
    open.value = true
    await vi.waitFor(() => expect(m.result.items.value).toHaveLength(2))
    expect(sent('GET', '/v1/notifications')[0]!.query.get('limit')).toBe('30')
    expect(sent('GET', '/v1/notifications')[0]!.query.get('cursor')).toBeNull()
    expect(m.result.unreadCount.value).toBe(7)
    expect(m.client.getQueryData(queryKeys.notifications.list())).toBeDefined()
  })

  it('"Daha eski" imleçle sonraki sayfayı ekler; sıra korunur; imleç bitince sayfa yok', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/notifications`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        return cursor
          ? json({ items: [item('3')], awaiting_count: 0, unread_count: 1 })
          : json({
              items: [item('1'), item('2')],
              awaiting_count: 0,
              unread_count: 1,
              next_cursor: 'c2',
            })
      }),
    )
    const m = mountSetup(() => useNotifications(true))
    await settleQueries(m.client)
    expect(m.result.query.hasNextPage.value).toBe(true)
    await m.result.loadMore()
    expect(m.result.items.value.map((n) => n.id)).toEqual(['1', '2', '3'])
    expect(sent('GET', '/v1/notifications')[1]!.query.get('cursor')).toBe('c2')
    expect(m.result.query.hasNextPage.value).toBe(false)
  })

  it('bozuk imleç (invalid_cursor): önbellek sıfırlanır, ilk sayfa yeniden okunur', async () => {
    let calls = 0
    server.use(
      http.get(`${ORIGIN}/v1/notifications`, ({ request }) => {
        calls += 1
        if (new URL(request.url).searchParams.get('cursor')) {
          return errorEnvelope('notifications.invalid_cursor', 422)
        }
        return json({
          items: [item('1')],
          awaiting_count: 0,
          unread_count: 1,
          next_cursor: 'bozuk',
        })
      }),
    )
    const m = mountSetup(() => useNotifications(true))
    await settleQueries(m.client)
    await m.result.loadMore()
    await settleQueries(m.client)
    expect(calls).toBeGreaterThanOrEqual(3)
    expect(m.result.items.value.map((n) => n.id)).toEqual(['1'])
    expect(sent('GET', '/v1/notifications').at(-1)!.query.get('cursor')).toBeNull()
  })

  it('okunmamış sekmesi istemci süzgecidir: yüklenen satırlardan !is_read', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/notifications`, () =>
        json({
          items: [item('1'), item('2', true), item('3')],
          awaiting_count: 0,
          unread_count: 2,
        }),
      ),
    )
    const m = mountSetup(() => useNotifications(true))
    await settleQueries(m.client)
    expect(m.result.items.value.filter((n) => !n.is_read).map((n) => n.id)).toEqual(['1', '3'])
    expect(sent('GET', '/v1/notifications')).toHaveLength(1)
  })
})

describe('usePushPublicKey', () => {
  it('enabled=false hata değildir; anahtar okunur', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/notifications/vapid-public-key`, () =>
        json({ enabled: false, public_key: '' }),
      ),
    )
    const m = mountSetup(() => usePushPublicKey())
    await settleQueries(m.client)
    expect(m.result.data.value).toEqual({ enabled: false, public_key: '' })
    expect(m.result.isError.value).toBe(false)
  })

  it('enabled isteği kapalıyken okunmaz', async () => {
    const m = mountSetup(() => usePushPublicKey(false))
    await settleQueries(m.client)
    expect(sent('GET', '/v1/notifications/vapid-public-key')).toHaveLength(0)
  })
})
