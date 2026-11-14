import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

import type { StreamState } from '@/shared/sse'

import { RECONNECT_NOTICE_MS, useConnectionNotice } from './use-connection-notice'

beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }))
afterEach(() => vi.useRealTimers())

function setup(initial: StreamState) {
  const state = ref<StreamState>(initial)
  const scope = effectScope()
  const notice = scope.run(() => useConnectionNotice(() => state.value))!
  return { state, notice, scope }
}

describe('useConnectionNotice (N-10-15)', () => {
  it("kopukluk 10 sn'yi aşınca görünür; açılınca söner", async () => {
    const { state, notice } = setup('open')
    state.value = 'waiting'
    await nextTick()
    vi.advanceTimersByTime(RECONNECT_NOTICE_MS - 1)
    expect(notice.visible.value).toBe(false)
    vi.advanceTimersByTime(1)
    expect(notice.visible.value).toBe(true)
    state.value = 'open'
    await nextTick()
    expect(notice.visible.value).toBe(false)
  })

  it('connecting ↔ waiting geçişleri sayacı sıfırlamaz; kısa kopma gösterge üretmez', async () => {
    const { state, notice } = setup('connecting')
    vi.advanceTimersByTime(6_000)
    state.value = 'waiting'
    await nextTick()
    vi.advanceTimersByTime(4_000)
    expect(notice.visible.value).toBe(true)
    state.value = 'open'
    await nextTick()
    state.value = 'waiting'
    await nextTick()
    state.value = 'open'
    await nextTick()
    vi.advanceTimersByTime(60_000)
    expect(notice.visible.value).toBe(false)
  })

  it('kasıtlı duraklama (paused, gizli sekme) ve kapanış göstergeyi söndürür / hiç açmaz', async () => {
    const { state, notice } = setup('waiting')
    vi.advanceTimersByTime(RECONNECT_NOTICE_MS)
    expect(notice.visible.value).toBe(true)
    state.value = 'paused'
    await nextTick()
    expect(notice.visible.value).toBe(false)
    state.value = 'closed'
    await nextTick()
    vi.advanceTimersByTime(60_000)
    expect(notice.visible.value).toBe(false)
  })

  it('sahip sökülünce bekleyen zamanlayıcı temizlenir (geç gösterge yok)', () => {
    const { notice, scope } = setup('waiting')
    scope.stop()
    vi.advanceTimersByTime(60_000)
    expect(notice.visible.value).toBe(false)
  })
})
