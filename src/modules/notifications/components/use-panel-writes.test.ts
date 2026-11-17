import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { makeNotification } from '@/shared/api/__tests__/defaults'
import { useToast } from '@/shared/ui'

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
import type { NotificationItem } from '../model/types'
import { usePanelWrites } from './use-panel-writes'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetAll()
  useToast().clear()
})
afterAll(() => server.close())
beforeEach(signIn)

const item = (over: Partial<NotificationItem> = {}): NotificationItem => makeNotification(over)

function setup() {
  const navigate = vi.fn()
  const m = mountSetup(() => usePanelWrites(navigate))
  return { ...m, navigate }
}

describe('usePanelWrites', () => {
  it('activate: okunmamış → yazma + gezinme; okunmuş → yalnız gezinme; hedefsiz → yalnız yazma', async () => {
    server.use(http.post(`${ORIGIN}/v1/notifications/n1/read`, () => noContent()))
    const m = setup()
    m.result.activate(item())
    expect(m.navigate).toHaveBeenCalledTimes(1)
    await settleQueries(m.client)
    expect(sent('POST', '/v1/notifications/n1/read')).toHaveLength(1)

    m.result.activate(item({ is_read: true }))
    expect(m.navigate).toHaveBeenCalledTimes(2)
    await settleQueries(m.client)
    expect(sent('POST', '/v1/notifications/n1/read')).toHaveLength(1)

    m.result.activate(item({ subject_ref: { kind: 'membership', id: 'x' } }))
    await settleQueries(m.client)
    expect(m.navigate).toHaveBeenCalledTimes(2)
    expect(sent('POST', '/v1/notifications/n1/read')).toHaveLength(2)
  })

  it('markOne: yazma sürerken pending işaretlenir, ikinci çağrı yok sayılır, sonra temizlenir', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    server.use(
      http.post(`${ORIGIN}/v1/notifications/n1/read`, async () => {
        await gate
        return noContent()
      }),
    )
    const m = setup()
    const first = m.result.markOne('n1')
    void m.result.markOne('n1')
    expect(m.result.pending.value.has('n1')).toBe(true)
    release()
    await first
    await settleQueries(m.client)
    expect(m.result.pending.value.has('n1')).toBe(false)
    expect(sent('POST', '/v1/notifications/n1/read')).toHaveLength(1)
  })

  it('markAllRead: marked_count metni; hata danger; sürerken ikinci çağrı yok', async () => {
    server.use(http.post(`${ORIGIN}/v1/notifications/read-all`, () => json({ marked_count: 4 })))
    const m = setup()
    await Promise.all([m.result.markAllRead(), m.result.markAllRead()])
    expect(sent('POST', '/v1/notifications/read-all')).toHaveLength(1)
    expect(useToast().queue.value[0]!.message).toBe('4 bildirim okundu sayıldı')
    expect(m.result.markAllBusy.value).toBe(false)

    useToast().clear()
    server.use(
      http.post(`${ORIGIN}/v1/notifications/read-all`, () =>
        errorEnvelope('platform.internal', 500),
      ),
    )
    await m.result.markAllRead()
    expect(useToast().queue.value[0]!.tone).toBe('danger')
  })

  it('salt okunur mod (409 provisioning.write_not_allowed): kod → i18n bildirimi', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/notifications/n1/read`, () =>
        errorEnvelope('provisioning.write_not_allowed', 409),
      ),
    )
    const m = setup()
    await m.result.markOne('n1')
    const toast = useToast().queue.value[0]!
    expect(toast.tone).toBe('danger')
    expect(toast.message).not.toContain('sunucu iletisi')
  })
})
