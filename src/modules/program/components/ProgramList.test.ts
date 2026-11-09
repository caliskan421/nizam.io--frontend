import { afterEach, describe, expect, it } from 'vitest'

import { $, ADMIN_SCOPE, click, harness, resetHarness } from '../__tests__/harness'
import ProgramList from './ProgramList.vue'

afterEach(() => resetHarness())

const PROGRAMS = [
  { programId: 'p1', name: 'Teknofest 2026', year: 2026 },
  { programId: 'p2', name: 'Eski sezon', year: null },
]

describe('program satırları', () => {
  it('seçili program rozetle; diğerinde "Bu programa geç"; yıl yoksa nötr metin', () => {
    const h = harness(ADMIN_SCOPE)
    const wrapper = h.mount(ProgramList, { programs: PROGRAMS, currentId: 'p1', canEdit: true })
    expect($('[data-program="p1"]')?.dataset.current).toBe('true')
    expect($('[data-program="p1"] [data-testid="pg-select"]')).toBeNull()
    expect($('[data-program="p1"]')?.textContent).toContain('2026 sezonu')
    expect($('[data-program="p2"]')?.textContent).toContain('Yıl belirtilmemiş')
    click('[data-program="p2"] [data-testid="pg-select"]')
    expect(wrapper.emitted('select')).toEqual([['p2']])
  })

  it('eylemler olay olarak; yetkisizde gizli', () => {
    const h = harness(ADMIN_SCOPE)
    const wrapper = h.mount(ProgramList, { programs: PROGRAMS, currentId: 'p1', canEdit: true })
    click('[data-program="p2"] [data-testid="pg-edit"]')
    click('[data-program="p2"] [data-testid="pg-reset"]')
    click('[data-program="p2"] [data-testid="pg-delete"]')
    expect(wrapper.emitted('edit')).toEqual([['p2']])
    expect(wrapper.emitted('reset')).toEqual([[PROGRAMS[1]]])
    expect(wrapper.emitted('delete')).toEqual([[PROGRAMS[1]]])
    resetHarness()
    const h2 = harness(ADMIN_SCOPE)
    h2.mount(ProgramList, { programs: PROGRAMS, currentId: 'p1', canEdit: false })
    expect($('[data-testid="pg-edit"]')).toBeNull()
    expect($('[data-testid="pg-delete"]')).toBeNull()
  })
})
