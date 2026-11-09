import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { ref } from 'vue'

import type { ScopeSelection } from '@/shared/scope/resolve'

import { ADMIN_SCOPE, COORD_SCOPE, server } from '../../model/__tests__/harness'
import { formsHarness, resetForms, type WhoSeed } from './__tests__/forms-harness'
import { useTaskDepartments } from './use-task-departments'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetForms())
afterAll(() => server.close())

const DEPTS = [
  { id: 'd1', name: 'Yazılım' },
  { id: 'd2', name: 'Elektronik' },
  { id: 'd3', name: 'Mekanik' },
]
const MEMBER_SCOPE: ScopeSelection = { programId: 'p1', lens: 'member', departmentId: 'd3' }

function setup(scope: ScopeSelection, who: WhoSeed, selected = '') {
  const h = formsHarness(scope, who)
  h.departments(DEPTS)
  const chosen = ref(selected)
  const r = h.run(() => useTaskDepartments(chosen))
  return { ...r, chosen }
}

// Mercek × rol (E-03-06/57, P1): seçenekler yetki olgusundan, mercekten değil.
describe('useTaskDepartments — hedef departmanlar (s.139) ve ek atama (s.140)', () => {
  it.each([
    ['yönetici, Admin merceği', ADMIN_SCOPE, { companyAdmin: true }, ['d2', 'd3', 'd1']],
    [
      'yönetici, Koordinatör merceği (yetki korunur)',
      COORD_SCOPE,
      { companyAdmin: true },
      ['d2', 'd3', 'd1'],
    ],
    [
      'koordinatör (d1), üye (d3)',
      COORD_SCOPE,
      {
        rows: [
          { departmentId: 'd1', role: 'koordinator' },
          { departmentId: 'd3', role: 'uye' },
        ],
      },
      ['d1'],
    ],
    ['yalnız üye', MEMBER_SCOPE, { rows: [{ departmentId: 'd3', role: 'uye' }] }, []],
    [
      'başka programdaki koordinatörlük yetki vermez',
      COORD_SCOPE,
      { rows: [{ departmentId: 'd1', role: 'koordinator', programId: 'p2' }] },
      [],
    ],
  ] as const)('%s', (_name, scope, who, expected) => {
    const r = setup(scope, who)
    expect(r.options.value.map((o) => o.value)).toEqual(expected)
  })

  it('adlar programdaki departman adından, tr sıralı', () => {
    const r = setup(ADMIN_SCOPE, { companyAdmin: true })
    expect(r.options.value.map((o) => o.label)).toEqual(['Elektronik', 'Mekanik', 'Yazılım'])
  })

  it('ek atama yalnız seçili departmanın koordinatörüne; yöneticide tek atama', () => {
    const admin = setup(ADMIN_SCOPE, { companyAdmin: true }, 'd1')
    expect(admin.canAssignExtra.value).toBe(false)

    resetForms()
    const coord = setup(COORD_SCOPE, { rows: [{ departmentId: 'd1', role: 'koordinator' }] }, 'd1')
    expect(coord.canAssignExtra.value).toBe(true)
    coord.chosen.value = ''
    expect(coord.canAssignExtra.value).toBe(false)

    resetForms()
    const both = setup(
      ADMIN_SCOPE,
      {
        companyAdmin: true,
        rows: [{ departmentId: 'd2', role: 'koordinator' }],
      },
      'd2',
    )
    expect(both.canAssignExtra.value).toBe(true)
    both.chosen.value = 'd1'
    expect(both.canAssignExtra.value).toBe(false)
  })
})
