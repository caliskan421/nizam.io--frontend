import { describe, expect, it } from 'vitest'

import { clockOf, dayKey, dayName, fullDay } from './format'

describe('format', () => {
  const now = new Date(2026, 10, 14, 12, 0, 0)
  const local = (m: number, d: number, h = 9, min = 5) => new Date(2026, m, d, h, min).toISOString()
  it('bugün / dün / diğer', () => {
    expect(dayName(local(10, 14), now)).toBe('today')
    expect(dayName(local(10, 13), now)).toBe('yesterday')
    expect(dayName(local(10, 1), now)).toBeNull()
  })
  it('saat SS:dd ve gün tam biçimi', () => {
    expect(clockOf(local(10, 14, 9, 5))).toBe('09:05')
    expect(fullDay(local(10, 1))).toBe('1 Kas 2026')
  })
  it('gün anahtarı yerel güne göre', () => {
    expect(dayKey(local(10, 14, 0, 1))).toBe(dayKey(local(10, 14, 23, 59)))
  })
})
