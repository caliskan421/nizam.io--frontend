import { describe, expect, it } from 'vitest'

import { AVATAR_TONES, departmentCode, initialsOf, programAvatar, toneOf } from './program-avatar'

describe('program avatarı (BE-001 türetme)', () => {
  it('baş harfler: ilk iki sözcük, tr-TR büyük harf', () => {
    expect(initialsOf('şanlıurfa teknofest')).toBe('ŞT')
    expect(initialsOf('izmir  teknofest 2026')).toBe('İT')
    expect(initialsOf('  Tek  ')).toBe('T')
    expect(initialsOf('')).toBe('')
  })

  it('ton kimlikten kararlı ve paletin içinde', () => {
    expect(toneOf('p1')).toBe(toneOf('p1'))
    for (const id of ['a', 'p1', 'p2', '0b1c-uuid', 'çok-uzun-kimlik']) {
      expect(AVATAR_TONES).toContain(toneOf(id))
    }
    const tones = new Set(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'].map(toneOf))
    expect(tones.size).toBeGreaterThan(1)
  })

  it('programAvatar adı ve kimliği birleştirir', () => {
    expect(programAvatar({ programId: 'p1', name: 'Program Bir' })).toEqual({
      initials: 'PB',
      tone: toneOf('p1'),
    })
  })

  it('birim kodu: ProgramDepartment.code, yoksa baş harf', () => {
    expect(departmentCode('SİS', 'Sistem koordinatörlüğü')).toBe('SİS')
    expect(departmentCode('  ', 'altyapı ve tesisat')).toBe('AV')
    expect(departmentCode(undefined, 'Operasyon')).toBe('O')
    expect(departmentCode(null, 'Elektrik enerji')).toBe('EE')
  })
})
