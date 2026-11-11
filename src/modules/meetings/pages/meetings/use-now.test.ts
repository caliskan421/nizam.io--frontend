import { effectScope } from 'vue'
import { afterEach, expect, it, vi } from 'vitest'
import { useNow } from './use-now'
afterEach(() => vi.useRealTimers())
it('refreshes across midnight and removes its timer on disposal', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-12-31T20:59:30Z'))
  const scope = effectScope()
  const now = scope.run(useNow)!
  vi.advanceTimersByTime(60_000)
  expect(now.value.toISOString()).toBe('2026-12-31T21:00:30.000Z')
  scope.stop()
  expect(vi.getTimerCount()).toBe(0)
})
