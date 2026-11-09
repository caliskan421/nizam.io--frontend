import { describe, expect, it } from 'vitest'

import { atCeiling, GANTT_CEILING } from './ceiling'

describe('200 tavanı (BE-019)', () => {
  it('tam 200 kalem sınıra ulaşmış olabilir; 199 değil', () => {
    expect(GANTT_CEILING).toBe(200)
    expect(atCeiling(199)).toBe(false)
    expect(atCeiling(200)).toBe(true)
    expect(atCeiling(0)).toBe(false)
  })
})
