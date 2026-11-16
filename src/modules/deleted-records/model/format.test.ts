import { describe, expect, it } from 'vitest'

import {
  dayKey,
  dayStartIso,
  formatClock,
  formatDate,
  formatLong,
  formatMeetingWhen,
  isToday,
  shiftDay,
} from './format'

const TZ = 'Europe/Istanbul'

describe('silinen kayıtlar tarih biçimleri (kurulum saat dilimi)', () => {
  it('gg.aa.yyyy ve SS:DD kurulum saat diliminde', () => {
    // 21:30 UTC = 00:30 ertesi gün (Istanbul +03).
    expect(formatDate('2026-10-21T21:30:00Z', TZ)).toBe('22.10.2026')
    expect(formatClock('2026-10-21T21:30:00Z', TZ)).toBe('00:30')
    expect(formatDate('2026-10-21T21:30:00Z', 'UTC')).toBe('21.10.2026')
  })

  it('uzun biçim ve toplantı alt satırı', () => {
    expect(formatLong('2026-10-21T10:42:00Z', TZ)).toBe('21 Ekim 2026 13:42')
    expect(formatMeetingWhen('2026-10-24T07:00:00Z', TZ)).toBe('24 Ekim 10:00')
  })

  it('boş ya da geçersiz değer null (çağıran "—" yazar)', () => {
    expect(formatDate('', TZ)).toBeNull()
    expect(formatDate(null, TZ)).toBeNull()
    expect(formatDate('yarın', TZ)).toBeNull()
    expect(formatClock(undefined, TZ)).toBeNull()
    expect(formatLong('x', TZ)).toBeNull()
    expect(formatMeetingWhen('x', TZ)).toBe('')
    expect(dayKey('x', TZ)).toBeNull()
  })

  it('gün anahtarı ve gün kaydırma', () => {
    expect(dayKey('2026-10-21T21:30:00Z', TZ)).toBe('2026-10-22')
    expect(shiftDay('2026-11-02', 6)).toBe('2026-10-27')
    expect(shiftDay('2026-01-03', 6)).toBe('2025-12-28')
  })

  it('"bugün" kurulum saat diliminde aynı takvim günüdür', () => {
    const now = new Date('2026-10-21T22:00:00Z') // Istanbul: 22.10 01:00
    expect(isToday('2026-10-21T21:30:00Z', now, TZ)).toBe(true)
    expect(isToday('2026-10-21T10:00:00Z', now, TZ)).toBe(false)
    expect(isToday('2026-10-21T10:00:00Z', now, 'UTC')).toBe(true)
    expect(isToday(null, now, TZ)).toBe(false)
  })
})

describe('gün başlangıcı (aralık sınırı; M-D07)', () => {
  it('kurulum saat diliminde gün başı UTC anına çevrilir', () => {
    expect(dayStartIso('2026-11-12', TZ)).toBe('2026-11-11T21:00:00Z')
    expect(dayStartIso('2026-11-12', 'UTC')).toBe('2026-11-12T00:00:00Z')
  })

  it('DST dilimlerinde yaz/kış sapması gün başında uygulanır', () => {
    // New York: 12 Kasım (EST, -05) ve 12 Temmuz (EDT, -04).
    expect(dayStartIso('2026-11-12', 'America/New_York')).toBe('2026-11-12T05:00:00Z')
    expect(dayStartIso('2026-07-12', 'America/New_York')).toBe('2026-07-12T04:00:00Z')
  })
})
