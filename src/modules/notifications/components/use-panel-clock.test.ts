import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useInstanceStore } from '@/shared/instance/store'

import { mountSetup } from '../__tests__/harness'
import { PANEL_CLOCK_MS, usePanelClock } from './use-panel-clock'

beforeEach(() => vi.useFakeTimers({ now: new Date('2026-11-14T09:00:00Z') }))
afterEach(() => vi.useRealTimers())

describe('usePanelClock', () => {
  it('açıkken dakikalık ilerler; kapanınca durur', async () => {
    const open = ref(true)
    const m = mountSetup(() => usePanelClock(() => open.value))
    const start = m.result.now.value.getTime()
    vi.advanceTimersByTime(PANEL_CLOCK_MS)
    expect(m.result.now.value.getTime()).toBe(start + PANEL_CLOCK_MS)
    open.value = false
    await nextTick()
    vi.advanceTimersByTime(PANEL_CLOCK_MS * 3)
    expect(m.result.now.value.getTime()).toBe(start + PANEL_CLOCK_MS)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('yeniden açılınca saat hemen güncellenir', async () => {
    const open = ref(false)
    const m = mountSetup(() => usePanelClock(() => open.value))
    vi.setSystemTime(new Date('2026-11-14T10:30:00Z'))
    open.value = true
    await nextTick()
    expect(m.result.now.value.toISOString()).toBe('2026-11-14T10:30:00.000Z')
  })

  it('sahip sökülünce zamanlayıcı kalmaz', () => {
    const m = mountSetup(() => usePanelClock(() => true))
    expect(vi.getTimerCount()).toBe(1)
    m.wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('saat dilimi kurulum profilinden; profil yokken undefined', () => {
    const m = mountSetup(() => usePanelClock(() => false))
    expect(m.result.timeZone.value).toBeUndefined()
    useInstanceStore().profile = { timezone: 'Europe/Istanbul' } as never
    expect(m.result.timeZone.value).toBe('Europe/Istanbul')
  })
})
