import { describe, expect, it } from 'vitest'

import { agoText, dayText } from './ago'

const NOW = new Date('2026-10-20T12:00:00Z') // Europe/Istanbul 15:00
const TZ = 'Europe/Istanbul'

describe('göreli zaman etiketi (kurulum saat dilimi)', () => {
  it('bugün: az önce / dk / sa', () => {
    expect(agoText('2026-10-20T11:59:40Z', NOW, TZ)).toBe('az önce')
    expect(agoText('2026-10-20T11:15:00Z', NOW, TZ)).toBe('45 dk önce')
    expect(agoText('2026-10-20T09:30:00Z', NOW, TZ)).toBe('2 sa önce')
  })

  it('dün SS:dd; daha eski GG.AA SS:dd (gün sınırı kurulum diliminde)', () => {
    expect(agoText('2026-10-19T13:20:00Z', NOW, TZ)).toBe('dün 16:20')
    expect(agoText('2026-10-17T07:05:00Z', NOW, TZ)).toBe('17.10 10:05')
    // 20 Ekim 00:30 İstanbul = 19 Ekim 21:30 UTC: UTC'de dün olsa da kurulumda bugün
    expect(agoText('2026-10-19T21:30:00Z', NOW, TZ)).toBe('14 sa önce')
  })

  it('biçimsiz zaman → null; dayText yalnız GG.AA', () => {
    expect(agoText('dün', NOW, TZ)).toBeNull()
    expect(dayText('2026-10-19T21:30:00Z', TZ)).toBe('20.10')
    expect(dayText('x', TZ)).toBeNull()
  })
})
