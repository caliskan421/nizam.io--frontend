import { describe, expect, it } from 'vitest'

import { dayDiff, dayNumber, plannedEnd } from './dates'

describe('takvim günü aritmetiği', () => {
  it('gün farkı; ay ve yıl sınırı, artık yıl', () => {
    expect(dayDiff('2026-11-01', '2026-11-10')).toBe(9)
    expect(dayDiff('2026-11-10', '2026-11-01')).toBe(-9)
    expect(dayDiff('2026-12-31', '2027-01-01')).toBe(1)
    expect(dayDiff('2028-02-28', '2028-03-01')).toBe(2)
    expect(dayDiff('2026-11-01', '2026-11-01')).toBe(0)
  })

  it('bozuk ya da takvimde olmayan gün null', () => {
    expect(dayNumber('')).toBeNull()
    expect(dayNumber('2026-02-30')).toBeNull()
    expect(dayNumber('01.11.2026')).toBeNull()
    expect(dayDiff('', '2026-11-01')).toBeNull()
  })

  it('planlanan bitiş: planned_end_on boşsa end_on', () => {
    expect(plannedEnd({ planned_end_on: '', end_on: '2026-11-10' })).toBe('2026-11-10')
    expect(plannedEnd({ planned_end_on: '2026-11-08', end_on: '2026-11-10' })).toBe('2026-11-08')
  })
})
