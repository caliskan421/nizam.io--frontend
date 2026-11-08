import { describe, expect, it } from 'vitest'

import { daysBetween, formatDay, formatShortDay, istanbulToday } from './dates'

describe('liste tarih biçimleri', () => {
  it('bugün Europe/Istanbul takvim günü (UTC 21:30 → ertesi gün)', () => {
    expect(istanbulToday(new Date('2026-11-09T21:30:00Z'))).toBe('2026-11-10')
    expect(istanbulToday(new Date('2026-11-09T20:59:00Z'))).toBe('2026-11-09')
  })

  it('GG.AA.YYYY ve GG Aaa', () => {
    expect(formatDay('2026-07-25')).toBe('25.07.2026')
    expect(formatShortDay('2026-11-15')).toBe('15 Kas')
    expect(formatShortDay('2026-08-05')).toBe('05 Ağu')
    expect(formatDay('bozuk')).toBe('bozuk')
    expect(formatShortDay('bozuk')).toBe('bozuk')
  })

  it('gün farkı takvim günüdür (ay/yıl sınırı)', () => {
    expect(daysBetween('2026-11-09', '2026-11-11')).toBe(2)
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1)
    expect(daysBetween('2026-11-10', '2026-11-09')).toBe(-1)
    expect(daysBetween('x', '2026-11-09')).toBeNull()
  })
})
