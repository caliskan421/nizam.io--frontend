import { describe, expect, it } from 'vitest'

import { makeMyDepartment, type MyDepartmentRole } from '@/shared/api/__tests__/defaults'

import { parseStanding } from './standing-facts'

const me = {
  account_id: 'acc-1',
  email: 'a@example.test',
  full_name: 'Ayşe',
  company_admin: false,
  phone: null,
}

describe('K-2: MyDepartment.role kapalı enum + zorunlu department_code/coordinators (pin v0.23.0-api)', () => {
  it('rol kümesi koordinator | uye; satırlar pin öncesiyle aynı biçimde çözülür', () => {
    const roles: MyDepartmentRole[] = ['koordinator', 'uye']
    const s = parseStanding(me, {
      departments: roles.map((role, i) => makeMyDepartment({ department_id: `d${i}`, role })),
    })
    expect(s.rows.map((r) => [r.departmentId, r.role])).toEqual([
      ['d0', 'coordinator'],
      ['d1', 'member'],
    ])
  })

  it('yeni zorunlu alanlar (department_code, coordinators) standing satırına sızmaz — UI aynı', () => {
    const s = parseStanding(me, {
      departments: [
        makeMyDepartment({
          role: 'koordinator',
          department_code: 'MEK',
          coordinators: [{ account_id: 'c1', full_name: 'Koordinatör' }],
        }),
      ],
    })
    expect(s.rows).toEqual([
      {
        programId: 'prog-1',
        programName: 'Program',
        departmentId: 'dep-1',
        displayName: 'Departman',
        role: 'coordinator',
      },
    ])
  })

  it('spec dışı eski rol dizesi savunmada hâlâ yok sayılır (pin öncesi davranış)', () => {
    const s = parseStanding(me, {
      departments: [makeMyDepartment({ role: 'gozlemci' as MyDepartmentRole })],
    })
    expect(s.rows).toEqual([])
  })
})
