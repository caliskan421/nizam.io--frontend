import { describe, expect, it } from 'vitest'

import type { ScopeLens } from '@/shared/scope/scope'
import type { Standing, StandingRow } from '@/shared/scope/standing-facts'

import {
  administrationFacts,
  can,
  canSeeAdministration,
  countsByTab,
  ORGANIZATION_CAPABILITIES,
  ORGANIZATION_CAPABILITY_SOURCES,
  organizationFacts,
  serverRoleOf,
  teamRoleOf,
  USER_ROLE_TABS,
  userRoleFilterOf,
  type OrganizationActorFacts,
  type OrganizationCapability,
} from './capabilities'

// 05/08 `backend.md` §3 tabloları (kod okuması + ORGANIZATION-K*), olgu birleşimleri üzerinden:
// Y = şirket yöneticisi, K = bu departmanın koordinatörü (seçili programda), A = seçili programda
// herhangi bir departmanın koordinatörü, S = hedef çağıranın kendisi, U = hedef bu departmanda uye.
type Flag = 'Y' | 'K' | 'A' | 'S' | 'U'

function facts(...flags: Flag[]): OrganizationActorFacts {
  const has = (f: Flag) => flags.includes(f)
  return {
    companyAdmin: has('Y'),
    coordinator: has('K'),
    coordinatesAny: has('A') || has('K'),
    self: has('S'),
    targetRole: has('U') ? 'member' : null,
  }
}

const ALL = Object.keys(ORGANIZATION_CAPABILITIES) as OrganizationCapability[]
const ADMIN_ALL: OrganizationCapability[] = ALL

// Satır: olgular → görünür eylemler (listede olmayan her eylem GİZLİ beklenir).
const TABLE: ReadonlyArray<[string, OrganizationActorFacts, OrganizationCapability[]]> = [
  ['hiçbiri (üye ya da yabancı)', facts(), []],
  ['şirket yöneticisi, başka hesap', facts('Y'), ADMIN_ALL],
  [
    'şirket yöneticisi, kendi hesabı (yıkıcılar gizli)',
    facts('Y', 'S'),
    ALL.filter(
      (c) =>
        ![
          'deleteUser',
          'changeAccountStatus',
          'changeCompanyAdmin',
          'changeMembershipRole',
          'removeMember',
          'removeCoordinator',
        ].includes(c),
    ),
  ],
  [
    'bu departmanın koordinatörü, hedef uye',
    facts('K', 'U'),
    ['createUser', 'deleteUser', 'assignMembership', 'removeMember', 'viewTeam'],
  ],
  [
    'bu departmanın koordinatörü, hedefin rolü bilinmiyor (en dar)',
    facts('K'),
    ['createUser', 'deleteUser', 'assignMembership', 'viewTeam'],
  ],
  ['başka departmanın koordinatörü', facts('A', 'U'), ['deleteUser']],
  [
    'koordinatör, kendi hesabı',
    facts('K', 'S', 'U'),
    ['createUser', 'assignMembership', 'viewTeam'],
  ],
]

describe('organizasyon capability tablosu (05/08 backend.md §3)', () => {
  it.each(TABLE)('%s', (_label, f, visible) => {
    for (const capability of ALL) {
      expect(can(capability, f), capability).toBe(visible.includes(capability))
    }
  })

  it('her yeteneğin kaynak satırı var (kural kimliği / backend.md bölümü)', () => {
    expect(Object.keys(ORGANIZATION_CAPABILITY_SOURCES).sort()).toEqual([...ALL].sort())
    for (const capability of ALL) {
      expect(ORGANIZATION_CAPABILITY_SOURCES[capability]).toMatch(/backend §[23]/)
    }
  })
})

// --- Standing → olgular: mercek × rol × company_admin -------------------------------------

const P = 'p-1'
const D = 'd-1'
const OTHER = 'd-2'

function row(departmentId: string, role: StandingRow['role'], programId = P): StandingRow {
  return { programId, programName: 'Program', departmentId, displayName: departmentId, role }
}

function standing(companyAdmin: boolean, rows: StandingRow[], accountId = 'me'): Standing {
  return { accountId, fullName: 'Ben', email: 'ben@ornek.test', companyAdmin, rows }
}

const PERSONAS: ReadonlyArray<[string, Standing, OrganizationCapability[]]> = [
  ['yönetici (ekip satırı yok)', standing(true, []), ADMIN_ALL],
  ['yönetici + bu birimin koordinatörü', standing(true, [row(D, 'coordinator')]), ADMIN_ALL],
  [
    'koordinatör (bu birim)',
    standing(false, [row(D, 'coordinator')]),
    ['createUser', 'deleteUser', 'assignMembership', 'removeMember', 'viewTeam'],
  ],
  ['koordinatör (başka birim)', standing(false, [row(OTHER, 'coordinator')]), ['deleteUser']],
  ['üye (bu birim)', standing(false, [row(D, 'member')]), []],
  ['başka programın koordinatörü', standing(false, [row(D, 'coordinator', 'p-2')]), []],
]

// Mercek yetki DEĞİLDİR (P1): olgu üreticisi merceği girdi olarak almaz; aynı standing her
// mercekte aynı olguları üretir. Mercek kapsam anlık görüntüsünde dursa da sonuç değişmez.
const LENSES: ReadonlyArray<ScopeLens | null> = ['admin', 'coordinator', 'member', null]

describe('organizationFacts — mercek × rol × company_admin (P1)', () => {
  it.each(PERSONAS)('%s', (_label, s, visible) => {
    const results = LENSES.map(() =>
      organizationFacts(s, P, { departmentId: D, accountId: 'target', targetRole: 'member' }),
    )
    for (const f of results) {
      for (const capability of ALL) {
        expect(can(capability, f), capability).toBe(visible.includes(capability))
      }
    }
    expect(new Set(results.map((f) => JSON.stringify(f))).size).toBe(1)
  })

  it('standing yoksa her olgu false (eylemler gizli)', () => {
    const f = organizationFacts(null, P, { departmentId: D })
    expect(ALL.filter((c) => can(c, f))).toEqual([])
  })

  it('hedef = çağıran → self', () => {
    expect(organizationFacts(standing(true, []), P, { accountId: 'me' }).self).toBe(true)
    expect(organizationFacts(standing(true, []), P, { accountId: 'x' }).self).toBe(false)
    expect(organizationFacts(standing(true, []), P, {}).self).toBe(false)
  })
})

describe('Yönetim grubu / rota kapısı (E-00-23/24, P1, P13, P16)', () => {
  it.each([
    ['yönetici', standing(true, []), true],
    [
      'Koordinatör merceğindeki yönetici (mercek girdi değil)',
      standing(true, [row(D, 'coordinator')]),
      true,
    ],
    ['koordinatör', standing(false, [row(D, 'coordinator')]), false],
    ['üye', standing(false, [row(D, 'member')]), false],
  ] as const)('%s', (_label, s, expected) => {
    expect(canSeeAdministration(administrationFacts(s))).toBe(expected)
  })

  it('standing gelmeden Yönetim görünmez (E-00-11)', () => {
    expect(canSeeAdministration(administrationFacts(null))).toBe(false)
    expect(canSeeAdministration({ ready: false, companyAdmin: true })).toBe(false)
  })
})

describe('rol değerleri (K1: yalnız bu dosyada)', () => {
  it('sunucu rolü ↔ istemci rolü', () => {
    expect(teamRoleOf('koordinator')).toBe('coordinator')
    expect(teamRoleOf('uye')).toBe('member')
    expect(teamRoleOf('admin')).toBeNull()
    expect(serverRoleOf('coordinator')).toBe('koordinator')
    expect(serverRoleOf('member')).toBe('uye')
  })

  it('rol sekmesi → sunucu role süzgeci: Tümü süzgeçsiz, Admin company_admin, K/Ü sunucu rolü', () => {
    expect(USER_ROLE_TABS).toEqual(['tumu', 'admin', 'koordinator', 'uye'])
    expect(userRoleFilterOf('tumu')).toBeNull()
    expect(userRoleFilterOf('admin')).toBe('company_admin')
    expect(userRoleFilterOf('koordinator')).toBe('koordinator')
    expect(userRoleFilterOf('uye')).toBe('uye')
  })

  it('role_counts → sekme sayaçları (all rolden bağımsız toplam)', () => {
    expect(countsByTab({ all: 185, company_admin: 3, koordinator: 21, uye: 160 })).toEqual({
      tumu: 185,
      admin: 3,
      koordinator: 21,
      uye: 160,
    })
  })
})
