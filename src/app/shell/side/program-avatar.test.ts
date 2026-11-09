import { describe, expect, it } from 'vitest'

import {
  AVATAR_TONES,
  departmentCode,
  initialsOf,
  programAvatar,
  programAvatars,
  toneOf,
} from './program-avatar'

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

  it('aynı baş harfli iki program: harf ve renk farklı (ikinci harf stratejisi)', () => {
    const programs = [
      { programId: 'p-2025', name: 'Teknofest 2025' },
      { programId: 'p-2026', name: 'Teknofest 2026' },
    ]
    const a = programAvatar(programs[0]!, programs)
    const b = programAvatar(programs[1]!, programs)
    expect(a.initials).toBe('T2')
    expect(b.initials).toBe('T6')
    expect(a.tone).not.toBe(b.tone)
  })

  it('girdi sırasından bağımsız ve kararlı; menü ile kart aynı sonucu verir', () => {
    const programs = [
      { programId: 'c', name: 'Tarım Teknolojileri' },
      { programId: 'a', name: 'Teknofest Tasarım' },
      { programId: 'b', name: 'Takım Toplantısı' },
    ]
    const forward = programAvatars(programs)
    const reversed = programAvatars([...programs].reverse())
    for (const p of programs) expect(reversed.get(p.programId)).toEqual(forward.get(p.programId))
    const labels = [...forward.values()].map((v) => v.initials)
    expect(new Set(labels).size).toBe(3)
    expect(forward.get('a')!.initials).toBe('TT')
  })

  it('beş programa kadar her ton farklı; fazlasında tonlar dengeli dağılır', () => {
    const five = ['k1', 'k2', 'k3', 'k4', 'k5'].map((id) => ({ programId: id, name: 'Aynı Ad' }))
    const tones = [...programAvatars(five).values()].map((v) => v.tone)
    expect(new Set(tones).size).toBe(5)
    const ten = Array.from({ length: 10 }, (_, i) => ({ programId: `x${i}`, name: `P ${i}` }))
    const counts = new Map<number, number>()
    for (const v of programAvatars(ten).values()) counts.set(v.tone, (counts.get(v.tone) ?? 0) + 1)
    expect([...counts.values()]).toEqual([2, 2, 2, 2, 2])
  })

  it('tek program: liste verilmezse kendi kimlik tonu; liste programı içermezse eklenir', () => {
    const p = { programId: 'solo', name: 'Program Bir' }
    expect(programAvatar(p)).toEqual({ initials: 'PB', tone: toneOf('solo') })
    expect(programAvatar(p, [{ programId: 'other', name: 'Başka' }]).initials).toBe('PB')
  })

  it('birim kodu: ProgramDepartment.code, yoksa baş harf', () => {
    expect(departmentCode('SİS', 'Sistem koordinatörlüğü')).toBe('SİS')
    expect(departmentCode('  ', 'altyapı ve tesisat')).toBe('AV')
    expect(departmentCode(undefined, 'Operasyon')).toBe('O')
    expect(departmentCode(null, 'Elektrik enerji')).toBe('EE')
  })
})
