import { describe, expect, it } from 'vitest'

import { parseStanding, type Standing } from '@/shared/scope/standing-facts'

import {
  DELETED_RECORDS_CAPABILITY_ACTIONS,
  DELETED_RECORDS_CAPABILITY_SOURCES,
  deletedRecordsCapabilities,
} from './capabilities'

function standing(companyAdmin: boolean, role?: string): Standing {
  return parseStanding(
    { account_id: 'acc-1', email: 'a@b.test', full_name: 'Ayşe', company_admin: companyAdmin },
    {
      departments: role
        ? [
            {
              program_id: 'p1',
              program_name: 'Program',
              department_id: 'd1',
              display_name: 'Birim',
              role,
            },
          ]
        : [],
    },
  )
}

describe('silinen kayıtlar capability (P36: yalnız şirket yöneticisi)', () => {
  it.each([
    ['şirket yöneticisi', standing(true), true],
    [
      'yönetici + koordinatör satırı (mercek yetki değildir, P1)',
      standing(true, 'koordinator'),
      true,
    ],
    ['koordinatör', standing(false, 'koordinator'), false],
    ['üye', standing(false, 'uye'), false],
    ['olgu yok', null, false],
  ] as const)('%s → %s', (_name, facts, allowed) => {
    const caps = deletedRecordsCapabilities(facts)
    expect(caps.view).toBe(allowed)
    expect(caps.restore).toBe(allowed)
    expect(caps.purge).toBe(allowed)
  })

  it('her eylemin kaynağı yazılı', () => {
    expect(Object.keys(DELETED_RECORDS_CAPABILITY_SOURCES).sort()).toEqual(
      [...DELETED_RECORDS_CAPABILITY_ACTIONS].sort(),
    )
    for (const source of Object.values(DELETED_RECORDS_CAPABILITY_SOURCES)) {
      expect(source).toMatch(/istemci-akislari/)
    }
  })
})
