import { describe, expect, it } from 'vitest'

import {
  AVATAR_TONES,
  departmentCode,
  initialsOf,
  programAvatar,
  programAvatars,
  toneOf,
} from './program-avatar'

describe('program avatarı (BE-001: sunucu alanı, yoksa türetme)', () => {
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

  it('sekiz programa kadar her ton farklı; fazlasında tonlar dengeli dağılır', () => {
    const eight = Array.from({ length: 8 }, (_, i) => ({ programId: `k${i}`, name: 'Aynı Ad' }))
    const tones = [...programAvatars(eight).values()].map((v) => v.tone)
    expect(new Set(tones).size).toBe(8)
    const sixteen = Array.from({ length: 16 }, (_, i) => ({ programId: `x${i}`, name: `P ${i}` }))
    const counts = new Map<string, number>()
    for (const v of programAvatars(sixteen).values())
      counts.set(v.tone, (counts.get(v.tone) ?? 0) + 1)
    expect([...counts.values()]).toEqual([2, 2, 2, 2, 2, 2, 2, 2])
  })

  it('sunucu kısa adı ve rengi olduğu gibi gösterilir (türetme yok)', () => {
    const p = { programId: 'p1', name: 'Program Bir', shortName: 'tf26', color: 'red' as const }
    expect(programAvatar(p)).toEqual({ initials: 'tf26', tone: 'red' })
  })

  it('alanlar bağımsızdır: yalnız kısa ad ya da yalnız renk verilince diğeri türetilir', () => {
    const onlyName = programAvatar({ programId: 'p1', name: 'Program Bir', shortName: 'XY' })
    expect(onlyName).toEqual({ initials: 'XY', tone: toneOf('p1') })
    const onlyColor = programAvatar({ programId: 'p1', name: 'Program Bir', color: 'slate' })
    expect(onlyColor).toEqual({ initials: 'PB', tone: 'slate' })
  })

  it('açık değerler çakışma kümesine girer: türetilen harf ve ton onlarla çakışmaz', () => {
    const programs = [
      { programId: 'a', name: 'Teknofest Bir', shortName: 'TB', color: 'violet' as const },
      { programId: 'b', name: 'Takım Bir' },
    ]
    const out = programAvatars(programs)
    expect(out.get('a')).toEqual({ initials: 'TB', tone: 'violet' })
    expect(out.get('b')!.initials).not.toBe('TB')
    expect(out.get('b')!.tone).not.toBe('violet')
  })

  it('liste içeriği (kısa ad/renk) değişince bayat sonuç dönmez', () => {
    const base = { programId: 'p1', name: 'Program Bir' }
    expect(programAvatar(base).initials).toBe('PB')
    expect(programAvatar({ ...base, shortName: 'ZZ' }).initials).toBe('ZZ')
    expect(programAvatar({ ...base, color: 'gold' }).tone).toBe('gold')
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
