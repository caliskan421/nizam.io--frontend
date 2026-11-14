import { describe, expect, it } from 'vitest'

import {
  TYPING_SEND_INTERVAL_MS,
  TYPING_TTL_MS,
  createTypingThrottle,
  createTypingTracker,
} from './typing'

describe('yazıyor gönderimi (en çok 1/3 sn)', () => {
  it('aralık dolmadan ikinci gönderim yok; dolunca serbest; reset sıfırlar', () => {
    let t = 1_000
    const throttle = createTypingThrottle(undefined, () => t)
    expect(throttle.take()).toBe(true)
    t += TYPING_SEND_INTERVAL_MS - 1
    expect(throttle.take()).toBe(false)
    t += 1
    expect(throttle.take()).toBe(true)
    throttle.reset()
    expect(throttle.take()).toBe(true)
    expect(TYPING_SEND_INTERVAL_MS).toBe(3000)
  })
})

describe('yazıyor göstergesi (önbelleğe yazılmaz, ~5 sn)', () => {
  it('olay süresince görünür; süre dolunca kalkar; sohbetler ayrı', () => {
    let t = 0
    const tracker = createTypingTracker(undefined, () => t)
    tracker.touch('c1', 'a')
    tracker.touch('c1', 'b')
    tracker.touch('c2', 'z')
    expect(tracker.typing('c1').sort()).toEqual(['a', 'b'])
    t += TYPING_TTL_MS - 1
    tracker.touch('c1', 'a')
    expect(tracker.typing('c1').sort()).toEqual(['a', 'b'])
    t += 2
    expect(tracker.typing('c1')).toEqual(['a'])
    t += TYPING_TTL_MS
    expect(tracker.typing('c1')).toEqual([])
    expect(tracker.typing('c2')).toEqual([])
    tracker.touch('c2', 'z')
    tracker.clear()
    expect(tracker.typing('c2')).toEqual([])
  })
})
