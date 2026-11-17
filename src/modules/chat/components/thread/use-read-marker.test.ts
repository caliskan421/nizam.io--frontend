// Ö-03: odak/görünürlük dönüşü dinleyicileri sökülmede KALKAR (sızıntı yok); sökülmüş sahip
// artık okundu isteği başlatmaz. Gerçek süre yok: sahte saat.
import { ref } from 'vue'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { authSession } from '@/shared/http'

import { msg } from '../../__tests__/fixtures'
import {
  http,
  mountSetup,
  noContent,
  ORIGIN,
  resetAll,
  sent,
  server,
  signIn,
} from '../../__tests__/harness'
import { READ_DEBOUNCE_MS, useReadMarker } from './use-read-marker'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  signIn()
  server.use(http.post(`${ORIGIN}/v1/chats/c1/read`, () => noContent()))
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  authSession.clear()
  resetAll()
})

function setup(ready: () => boolean = () => true) {
  const list = ref<HTMLElement | null>(document.createElement('div'))
  const el = document.createElement('div')
  el.dataset.messageId = 'm1'
  list.value!.append(el)
  const items = [msg(1, { sender_account_id: 'baska' })]
  return mountSetup(() =>
    useReadMarker({
      list,
      items: () => items,
      chatId: () => 'c1',
      programId: () => 'p1',
      meId: () => 'ben',
      hasNewer: () => false,
      unread: () => 1,
      ready,
    }),
  )
}

const reads = () => sent('POST', '/v1/chats/c1/read')

describe('odak/görünürlük dinleyicileri', () => {
  it('kurulumda focus + visibilitychange dinlenir; sökülünce AYNI işlevlerle kaldırılır', () => {
    const addWindow = vi.spyOn(globalThis, 'addEventListener')
    const removeWindow = vi.spyOn(globalThis, 'removeEventListener')
    const addDoc = vi.spyOn(document, 'addEventListener')
    const removeDoc = vi.spyOn(document, 'removeEventListener')
    const m = setup()

    const focus = addWindow.mock.calls.find((c) => c[0] === 'focus')
    const visibility = addDoc.mock.calls.find((c) => c[0] === 'visibilitychange')
    expect(focus).toBeDefined()
    expect(visibility).toBeDefined()
    expect(removeWindow.mock.calls.some((c) => c[0] === 'focus')).toBe(false)

    m.wrapper.unmount()
    expect(removeWindow.mock.calls.find((c) => c[0] === 'focus')?.[1]).toBe(focus![1])
    expect(removeDoc.mock.calls.find((c) => c[0] === 'visibilitychange')?.[1]).toBe(visibility![1])
  })

  it('sökülmeden önce odak dönüşü tek (birleşik) okundu isteği üretir', async () => {
    const m = setup()
    globalThis.dispatchEvent(new Event('focus'))
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(READ_DEBOUNCE_MS)
    expect(reads()).toHaveLength(1)
    m.wrapper.unmount()
  })

  it('sökülünce odak/görünürlük olayları artık istek başlatmaz; bekleyen gönderim iptal', async () => {
    const m = setup()
    globalThis.dispatchEvent(new Event('focus')) // bekleyen gönderim kuruldu
    m.wrapper.unmount()
    globalThis.dispatchEvent(new Event('focus'))
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(READ_DEBOUNCE_MS * 3)
    expect(reads()).toHaveLength(0)
  })

  it('hazır değilken otomatik okundu çıkmaz; hazır olunca tek istek (tekrar tetikle)', async () => {
    const ready = ref(false)
    const m = setup(() => ready.value)
    globalThis.dispatchEvent(new Event('focus'))
    await vi.advanceTimersByTimeAsync(READ_DEBOUNCE_MS * 2)
    expect(reads()).toHaveLength(0)
    ready.value = true
    m.result.touch()
    await vi.advanceTimersByTimeAsync(READ_DEBOUNCE_MS)
    expect(reads()).toHaveLength(1)
    m.wrapper.unmount()
  })
})
