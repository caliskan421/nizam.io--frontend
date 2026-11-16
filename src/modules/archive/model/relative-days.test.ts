import { describe, expect, it } from 'vitest'

import { daysSince } from './relative-days'

const NOW = new Date('2026-11-16T10:00:00Z')

describe('daysSince', () => {
  it('kurulum saat diliminin takvim günleri: aynı gün 0, dün 1, n gün önce n', () => {
    expect(daysSince('2026-11-16T06:00:00Z', NOW, 'Europe/Istanbul')).toBe(0)
    expect(daysSince('2026-11-15T20:00:00Z', NOW, 'Europe/Istanbul')).toBe(1)
    expect(daysSince('2026-11-15T10:00:00Z', NOW, 'Europe/Istanbul')).toBe(1)
    expect(daysSince('2026-10-24T10:00:00Z', NOW, 'Europe/Istanbul')).toBe(23)
  })

  it('gün sınırı saat dilimine göre: UTC günü ile kurulum günü ayrışabilir', () => {
    // 15 Kas 22:30 UTC = 16 Kas 01:30 İstanbul → kurulumda "bugün", UTC'de "dün".
    expect(daysSince('2026-11-15T22:30:00Z', NOW, 'Europe/Istanbul')).toBe(0)
    expect(daysSince('2026-11-15T22:30:00Z', NOW, 'UTC')).toBe(1)
  })

  it('null / bozuk → null; gelecek an 0; geçersiz dilim İstanbul', () => {
    expect(daysSince(null, NOW, 'UTC')).toBeNull()
    expect(daysSince('bozuk', NOW, 'UTC')).toBeNull()
    expect(daysSince('2026-11-20T10:00:00Z', NOW, 'UTC')).toBe(0)
    expect(daysSince('2026-11-15T10:00:00Z', NOW, 'Yok/Zone')).toBe(1)
    expect(daysSince('2026-11-15T10:00:00Z', NOW, null)).toBe(1)
  })
})
