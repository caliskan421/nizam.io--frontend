import { describe, expect, it } from 'vitest'

import { parseStanding, type Standing } from '@/shared/scope/standing-facts'

import { coordinatedUnitNames, homeVariant, isCoordinatorRole } from './capabilities'

function standing(companyAdmin: boolean, rows: Array<[string, string, string]> = []): Standing {
  return parseStanding(
    { account_id: 'acc-1', email: 'a@b.test', full_name: 'Ayşe', company_admin: companyAdmin },
    {
      departments: rows.map(([program, department, role]) => ({
        program_id: program,
        program_name: `Program ${program}`,
        department_id: department,
        display_name: `Birim ${department}`,
        role,
      })),
    },
  )
}

describe('sayfa seçimi (P53, W135 varsayımı 1)', () => {
  const coordinator = standing(false, [['p1', 'd1', 'koordinator']])
  const member = standing(false, [['p1', 'd1', 'uye']])
  const adminAndMember = standing(true, [['p1', 'd1', 'uye']])

  it('company_admin her mercekte yönetici sayfası (P1)', () => {
    for (const lens of ['admin', 'coordinator', 'member', null] as const) {
      expect(homeVariant(adminAndMember, lens), String(lens)).toBe('admin')
    }
  })

  it('yönetici olmayan: Koordinatör merceği K1, Üye merceği Ü1', () => {
    expect(homeVariant(coordinator, 'coordinator')).toBe('coordinator')
    expect(homeVariant(member, 'member')).toBe('member')
  })

  it('olgu ya da mercek yoksa yönetici sayfası (yükleniyor durumu onun)', () => {
    expect(homeVariant(null, 'member')).toBe('admin')
    expect(homeVariant(member, null)).toBe('admin')
    expect(homeVariant(member, 'admin')).toBe('admin')
  })
})

describe('ekip rolü ve koordinatörlük adları', () => {
  it('liste satırı rolü', () => {
    expect(isCoordinatorRole('koordinator')).toBe(true)
    expect(isCoordinatorRole('uye')).toBe(false)
  })

  it('yalnız seçili programdaki koordinatörlükler; tekrarsız', () => {
    const s = standing(false, [
      ['p1', 'd1', 'koordinator'],
      ['p1', 'd2', 'uye'],
      ['p2', 'd3', 'koordinator'],
      ['p1', 'd1', 'koordinator'],
    ])
    expect(coordinatedUnitNames(s, 'p1')).toEqual(['Birim d1'])
    expect(coordinatedUnitNames(s, null)).toEqual([])
    expect(coordinatedUnitNames(null, 'p1')).toEqual([])
  })
})
