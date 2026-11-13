import { describe, expect, it } from 'vitest'

import { parseStanding, type Standing } from '@/shared/scope/standing-facts'

import {
  canAddUser,
  canCreateMeeting,
  canCreateReport,
  canOpenDeletedRecords,
  canReadDashboard,
  canSeeAdminRegions,
  HOME_CAPABILITY_SOURCES,
} from './capabilities'

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

const ADMIN = standing(true)
const COORDINATOR = standing(false, [['p1', 'd1', 'koordinator']])
const MEMBER = standing(false, [['p1', 'd1', 'uye']])
const OTHER_PROGRAM_COORDINATOR = standing(false, [
  ['p2', 'd1', 'koordinator'],
  ['p1', 'd1', 'uye'],
])

describe('ana sayfa capability', () => {
  it('pano yalnız şirket yöneticisi + Admin merceği (REPORTING-K01, P1)', () => {
    expect(canReadDashboard(ADMIN, 'admin')).toBe(true)
    expect(canReadDashboard(ADMIN, 'coordinator')).toBe(false)
    expect(canReadDashboard(ADMIN, 'member')).toBe(false)
    expect(canReadDashboard(COORDINATOR, 'admin')).toBe(false)
    expect(canReadDashboard(null, 'admin')).toBe(false)
  })

  it.each([
    ['yönetici', ADMIN, true],
    ['koordinatör', COORDINATOR, true],
    ['salt üye', MEMBER, false],
    ['başka programda koordinatör', OTHER_PROGRAM_COORDINATOR, false],
  ] as const)('toplantı / kullanıcı kutucuğu: %s → %s', (_n, facts, visible) => {
    expect(canCreateMeeting(facts, 'p1')).toBe(visible)
    expect(canAddUser(facts, 'p1')).toBe(visible)
  })

  it('program seçili değilse ya da olgu yoksa gizli (en dar güvenli)', () => {
    expect(canCreateMeeting(ADMIN, null)).toBe(false)
    expect(canAddUser(null, 'p1')).toBe(false)
  })

  it.each([
    ['yönetici', ADMIN, true],
    ['koordinatör', COORDINATOR, false],
    ['salt üye', MEMBER, false],
    ['olgu yok', null, false],
  ] as const)('"Silinen kayıtlar" düğmesi (E-01-02, P36): %s → %s', (_n, facts, visible) => {
    expect(canOpenDeletedRecords(facts)).toBe(visible)
  })

  it.each([
    ['yönetici', ADMIN, true],
    ['koordinatör', COORDINATOR, false],
    ['salt üye', MEMBER, false],
    ['olgu yok', null, false],
  ] as const)(
    'yönetici bölgeleri ve "Rapor oluştur" (E-01-12/19…39, P47/P53): %s → %s',
    (_n, facts, visible) => {
      expect(canSeeAdminRegions(facts)).toBe(visible)
      expect(canCreateReport(facts)).toBe(visible)
    },
  )

  it('her kararın kaynağı yazılı', () => {
    for (const source of Object.values(HOME_CAPABILITY_SOURCES))
      expect(source).toMatch(/K01|README/)
  })
})
