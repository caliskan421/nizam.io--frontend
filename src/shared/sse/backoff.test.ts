import { describe, expect, it } from 'vitest'

import { BACKOFF_MAX_MS, JITTER_MAX_MS, reconnectDelay } from './backoff'

describe('reconnectDelay', () => {
  it('1, 2, 4, 8 sn üstel; jitter 0–5 sn eklenir', () => {
    expect([0, 1, 2, 3].map((n) => reconnectDelay(n, () => 0))).toEqual([1000, 2000, 4000, 8000])
    expect(reconnectDelay(0, () => 0.999999)).toBeLessThan(1000 + JITTER_MAX_MS)
  })
  it('60 sn tavanı (jitter hariç) ve büyük deneme sayısında taşma yok', () => {
    expect(reconnectDelay(6, () => 0)).toBe(BACKOFF_MAX_MS)
    expect(reconnectDelay(1000, () => 0)).toBe(BACKOFF_MAX_MS)
    expect(reconnectDelay(1000, () => 0.9999)).toBeLessThan(BACKOFF_MAX_MS + JITTER_MAX_MS)
  })
})
