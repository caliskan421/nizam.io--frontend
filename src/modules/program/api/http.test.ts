import { describe, expect, it } from 'vitest'

import { PROGRAM_STALE_MS, programHeader, TRANSFER_PAGE_LIMIT } from './http'

describe('program HTTP yardımcıları', () => {
  it('S2 program başlığı; sayfa boyu ve tazelik', () => {
    expect(programHeader('p1')).toEqual({ 'X-Nizamio-Program': 'p1' })
    expect(TRANSFER_PAGE_LIMIT).toBeLessThanOrEqual(200)
    expect(PROGRAM_STALE_MS).toBe(30_000)
  })
})
