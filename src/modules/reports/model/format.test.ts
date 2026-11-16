import { describe, expect, it } from 'vitest'

import {
  formatBytes,
  formatDay,
  formatShortDay,
  initials,
  instantDate,
  instantDay,
  instantDateTime,
  instantTime,
  monthLabel,
  percent,
  share,
  upper,
} from './format'

describe('önizleme biçimleri', () => {
  it('takvim günü çevrilmeden gg.aa.yyyy; biçim dışı değer null', () => {
    expect(formatDay('2026-10-21')).toBe('21.10.2026')
    expect(formatShortDay('2026-10-21')).toBe('21.10')
    expect(formatDay('2026-10-21T10:00:00Z')).toBeNull()
    expect(formatDay(null)).toBeNull()
  })

  it('anlar kurulum saat diliminde (UTC+3) gün ve saate indirilir', () => {
    const iso = '2026-10-21T22:30:00Z'
    expect(instantDate(iso, 'Europe/Istanbul')).toBe('22.10.2026')
    expect(instantTime(iso, 'Europe/Istanbul')).toBe('01:30')
    expect(instantDateTime(iso, 'Europe/Istanbul')).toBe('22.10.2026 01:30')
    expect(instantDate(iso, 'UTC')).toBe('21.10.2026')
  })

  it('geçersiz an ya da dilim null', () => {
    expect(instantDate('nope', 'UTC')).toBeNull()
    expect(instantTime('2026-10-21T10:00:00Z', 'Yok/Dilim')).toBeNull()
    expect(instantDateTime('nope', 'UTC')).toBeNull()
  })

  it('ay etiketi: kısa ve uzun (yıllı); bozuk değer aynen', () => {
    expect(monthLabel('2026-10')).toBe('Eki')
    expect(monthLabel('2026-06', true)).toBe('Haziran 2026')
    expect(monthLabel('bozuk')).toBe('bozuk')
  })

  it('yüzde ve pay: payda 0 güvenli', () => {
    expect(percent(39, 79)).toBe('%49')
    expect(percent(0, 0)).toBe('%0')
    expect(share(1, 4)).toBe(25)
    expect(share(5, 0)).toBe(0)
    expect(share(9, 3)).toBe(100)
  })

  it('Türkçe büyük harf ve baş harfler', () => {
    expect(upper('altyapı ve tesisat')).toBe('ALTYAPI VE TESİSAT')
    expect(initials('Şanlıurfa Teknofest')).toBe('ŞT')
    expect(initials('')).toBe('')
  })
})

describe('boyut ve gün biçimleri (BE-136, BE-123)', () => {
  it('bayt: ikili birim, virgüllü ondalık; geçersiz null', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2,0 KB')
    expect(formatBytes(3_984_588)).toBe('3,8 MB')
    expect(formatBytes(432_642_458)).toBe('412,6 MB')
    expect(formatBytes(5 * 1024 ** 3)).toBe('5,0 GB')
    expect(formatBytes(-1)).toBeNull()
    expect(formatBytes(Number.NaN)).toBeNull()
  })

  it('an → takvim günü kurulum saat diliminde (gece yarısı sınırı)', () => {
    expect(instantDay('2026-10-21T22:30:00Z', 'Europe/Istanbul')).toBe('2026-10-22')
    expect(instantDay('2026-10-21T22:30:00Z', 'UTC')).toBe('2026-10-21')
    expect(instantDay('x', 'UTC')).toBeNull()
  })
})
