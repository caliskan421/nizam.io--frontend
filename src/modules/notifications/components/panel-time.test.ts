import { describe, expect, it } from 'vitest'

import { fullTime, groupOf, rowTime } from './panel-time'

const TZ = 'Europe/Istanbul' // UTC+3
// 14 Kasım 2026 12:00 İstanbul
const NOW = new Date('2026-11-14T09:00:00Z')

describe('groupOf (kurulum günü)', () => {
  it('bugün / dün / daha eski; gün sınırı kurulum saat diliminde', () => {
    expect(groupOf('2026-11-14T08:59:00Z', NOW, TZ)).toBe('today')
    // 13 Kasım 23:30 UTC = 14 Kasım 02:30 İstanbul → bugün
    expect(groupOf('2026-11-13T23:30:00Z', NOW, TZ)).toBe('today')
    // 13 Kasım 20:00 UTC = 13 Kasım 23:00 İstanbul → dün
    expect(groupOf('2026-11-13T20:00:00Z', NOW, TZ)).toBe('yesterday')
    expect(groupOf('2026-11-12T20:00:00Z', NOW, TZ)).toBe('older')
  })

  it('ay başında dün önceki ayın son günü', () => {
    const now = new Date('2026-12-01T09:00:00Z')
    expect(groupOf('2026-11-30T10:00:00Z', now, TZ)).toBe('yesterday')
  })

  it('geçersiz tarih daha eski; gelecek zaman bugün', () => {
    expect(groupOf('bozuk', NOW, TZ)).toBe('older')
    expect(groupOf('2026-11-14T11:00:00Z', NOW, TZ)).toBe('today')
  })

  it('geçersiz ya da eksik dilim tarayıcı dilimine düşer (hata fırlatmaz)', () => {
    expect(() => groupOf('2026-11-14T08:00:00Z', NOW, 'Yok/Dilim')).not.toThrow()
    expect(() => groupOf('2026-11-14T08:00:00Z', NOW, undefined)).not.toThrow()
  })
})

describe('rowTime', () => {
  it('bugün: şimdi / N dk / N sa', () => {
    expect(rowTime('2026-11-14T08:59:30Z', NOW, TZ, 'today')).toBe('şimdi')
    expect(rowTime('2026-11-14T08:55:00Z', NOW, TZ, 'today')).toBe('5 dk')
    expect(rowTime('2026-11-14T08:01:00Z', NOW, TZ, 'today')).toBe('59 dk')
    expect(rowTime('2026-11-14T07:00:00Z', NOW, TZ, 'today')).toBe('2 sa')
  })

  it('saat farkı negatifse (saat kayması) şimdi', () => {
    expect(rowTime('2026-11-14T09:05:00Z', NOW, TZ, 'today')).toBe('şimdi')
  })

  it('dün: SS:dd; eski: GG.AA SS:dd (kurulum diliminde)', () => {
    expect(rowTime('2026-11-13T20:05:00Z', NOW, TZ, 'yesterday')).toBe('23:05')
    expect(rowTime('2026-10-02T07:30:00Z', NOW, TZ, 'older')).toBe('02.10 10:30')
  })

  it('geçersiz tarih boş metin', () => {
    expect(rowTime('bozuk', NOW, TZ, 'today')).toBe('')
    expect(fullTime('bozuk', TZ)).toBe('')
  })
})

describe('fullTime', () => {
  it('ham title: GG.AA.YYYY SS:dd', () => {
    expect(fullTime('2026-11-14T08:05:00Z', TZ)).toBe('14.11.2026 11:05')
  })
})
