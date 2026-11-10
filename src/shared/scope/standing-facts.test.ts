import { describe, expect, it } from 'vitest'

import {
  departmentOptions,
  lensOptions,
  parsePrograms,
  parseStanding,
  programOptions,
  scopeFacts,
} from './standing-facts'

const me = (companyAdmin: boolean) => ({
  account_id: 'acc-1',
  email: 'a@example.test',
  full_name: 'Ayşe Yılmaz',
  company_admin: companyAdmin,
})

const row = (program: string, department: string, role: string, name = department) => ({
  program_id: program,
  program_name: `Program ${program}`,
  department_id: department,
  display_name: name,
  role,
})

describe('standing olguları', () => {
  it('rol dizeleri tipe çevrilir; bilinmeyen rol yok sayılır; null liste boştur', () => {
    const s = parseStanding(me(false), {
      departments: [
        row('p1', 'd1', 'koordinator'),
        row('p1', 'd2', 'uye'),
        row('p1', 'd3', 'gozlemci'),
      ],
    })
    expect(s.rows.map((r) => [r.departmentId, r.role])).toEqual([
      ['d1', 'coordinator'],
      ['d2', 'member'],
    ])
    expect(parseStanding(me(true), { departments: null }).rows).toEqual([])
    expect(parseStanding(me(true), { departments: null }).companyAdmin).toBe(true)
  })

  it("yönetici programları listPrograms'tan, diğerleri satırlardan; ad sırası tr-TR", () => {
    const programs = parsePrograms({
      programs: [
        { program_id: 'p2', name: 'Zafer', short_name: 'ZF', color: 'teal' },
        { program_id: 'p1', name: 'Çelik', year: 2026, short_name: null, color: null },
        { program_id: 'p3', name: 'İnci', short_name: null, color: null },
      ],
    })
    const admin = parseStanding(me(true), { departments: [] })
    expect(programOptions(admin, programs).map((p) => p.name)).toEqual(['Çelik', 'İnci', 'Zafer'])
    expect(programOptions(admin, programs)[0]?.year).toBe(2026)
    // BE-001: kısa ad ve renk listPrograms'tan taşınır; verilmemiş alan null.
    expect(programOptions(admin, programs).map((p) => [p.shortName, p.color])).toEqual([
      [null, null],
      [null, null],
      ['ZF', 'teal'],
    ])

    const member = parseStanding(me(false), { departments: [row('p1', 'd1', 'uye')] })
    expect(programOptions(member, programs).map((p) => p.programId)).toEqual(['p1'])
    expect(programOptions(member, null)).toEqual([
      { programId: 'p1', name: 'Program p1', year: null, shortName: null, color: null },
    ])
  })

  it('mercek seçenekleri: admin olgusu + rol başına tekil departman sayısı', () => {
    const s = parseStanding(me(true), {
      departments: [
        row('p1', 'd1', 'koordinator'),
        row('p1', 'd2', 'koordinator'),
        row('p1', 'd1', 'uye'),
        row('p2', 'd9', 'uye'),
      ],
    })
    expect(lensOptions(s, 'p1')).toEqual([
      { lens: 'admin', departmentCount: 0 },
      { lens: 'coordinator', departmentCount: 2 },
      { lens: 'member', departmentCount: 1 },
    ])
    expect(lensOptions(s, 'p3')).toEqual([{ lens: 'admin', departmentCount: 0 }])
  })

  it('departman seçenekleri program ∧ mercek; admin merceğinde yok; ad sırası tr-TR', () => {
    const s = parseStanding(me(false), {
      departments: [
        row('p1', 'd1', 'koordinator', 'Yazılım'),
        row('p1', 'd2', 'koordinator', 'Çevre'),
        row('p1', 'd3', 'uye', 'Mekanik'),
        row('p2', 'd4', 'koordinator', 'Başka'),
      ],
    })
    expect(departmentOptions(s, 'p1', 'coordinator').map((d) => d.displayName)).toEqual([
      'Çevre',
      'Yazılım',
    ])
    expect(departmentOptions(s, 'p1', 'member').map((d) => d.departmentId)).toEqual(['d3'])
    expect(departmentOptions(s, 'p1', 'admin')).toEqual([])
  })

  it('kapsam olguları mercekten bağımsız; companyAdmin her kapsamda korunur (P1)', () => {
    const s = parseStanding(me(true), { departments: [row('p1', 'd1', 'koordinator')] })
    expect(scopeFacts(s, 'p1', 'd1')).toEqual({
      companyAdmin: true,
      coordinator: true,
      member: false,
    })
    expect(scopeFacts(s, 'p1', null)).toEqual({
      companyAdmin: true,
      coordinator: false,
      member: false,
    })
    // Başka programdaki satır bu kapsamda yetki vermez.
    expect(scopeFacts(s, 'p2', 'd1').coordinator).toBe(false)
    expect(scopeFacts(null, 'p1', 'd1')).toEqual({
      companyAdmin: false,
      coordinator: false,
      member: false,
    })
  })
})
