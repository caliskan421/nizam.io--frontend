import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useInstanceStore } from '@/shared/instance/store'

import {
  errorEnvelope,
  http,
  json,
  mountSetup,
  ORIGIN,
  resetAll,
  server,
  settleQueries,
  signIn,
} from '../__tests__/harness'
import { useNotificationPanel } from './use-notification-panel'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetAll()
  vi.useRealTimers()
})
afterAll(() => server.close())
beforeEach(() => {
  signIn()
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-14T09:00:00Z') })
})

const item = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  type: 'work.item.created',
  subject_ref: { kind: 'work_item', id: `w-${id}` },
  is_read: false,
  created_at: '2026-11-14T08:55:00Z',
  ...over,
})

function setup(open = ref(true)) {
  const navigate = vi.fn()
  const m = mountSetup(() => {
    useInstanceStore().profile = { timezone: 'Europe/Istanbul' } as never
    return useNotificationPanel({ open: () => open.value, onNavigate: navigate })
  })
  return { ...m, open, navigate }
}

describe('useNotificationPanel', () => {
  it('durum: yükleniyor → liste; boş; hata', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/notifications`, () => json({ items: [item('a')], unread_count: 1 })),
    )
    const m = setup()
    expect(m.result.state.value).toBe('loading')
    await settleQueries(m.client)
    expect(m.result.state.value).toBe('list')
    expect(m.result.unreadCount.value).toBe(1)

    server.use(http.get(`${ORIGIN}/v1/notifications`, () => json({ items: [], unread_count: 0 })))
    const empty = setup()
    await settleQueries(empty.client)
    expect(empty.result.state.value).toBe('empty')

    server.use(
      http.get(`${ORIGIN}/v1/notifications`, () => errorEnvelope('platform.internal', 400)),
    )
    const failed = setup()
    await settleQueries(failed.client)
    expect(failed.result.state.value).toBe('error')
  })

  it('gruplar: sunucu sırası korunur, boş grup yok; okunmamış sekmesi istemci süzgeci', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/notifications`, () =>
        json({
          items: [
            item('a'),
            item('b', { is_read: true }),
            item('c', { created_at: '2026-11-13T20:05:00Z' }),
          ],
          unread_count: 2,
        }),
      ),
    )
    const m = setup()
    await settleQueries(m.client)
    expect(m.result.groups.value.map((g) => [g.group, g.items.map((i) => i.id)])).toEqual([
      ['today', ['a', 'b']],
      ['yesterday', ['c']],
    ])
    m.result.tab.value = 'unread'
    expect(m.result.groups.value.map((g) => [g.group, g.items.map((i) => i.id)])).toEqual([
      ['today', ['a']],
      ['yesterday', ['c']],
    ])
  })

  it("kapanınca sekme Tümü'ye döner", async () => {
    server.use(http.get(`${ORIGIN}/v1/notifications`, () => json({ items: [], unread_count: 0 })))
    const m = setup()
    m.result.tab.value = 'unread'
    m.open.value = false
    await nextTick()
    expect(m.result.tab.value).toBe('all')
  })

  it('kapalıyken liste okunmaz', async () => {
    const m = setup(ref(false))
    await settleQueries(m.client)
    expect(m.result.state.value).toBe('loading')
    expect(m.client.isFetching()).toBe(0)
  })
})
