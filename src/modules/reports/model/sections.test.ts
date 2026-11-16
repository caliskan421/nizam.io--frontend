import { describe, expect, it } from 'vitest'

import {
  allSections,
  DEPARTMENT_CHILDREN,
  departmentsForRequest,
  isChild,
  isEmptySelection,
  isFullSelection,
  sectionsForRequest,
  toggleDepartment,
  sectionState,
  SECTION_IDS,
  toggleSection,
} from './sections'

describe('bölüm seçimi modeli (E-13-04)', () => {
  it('açılışta hepsi seçili; ana kutu türetilmiş "on"; hepsi seçiliyken tam rapor', () => {
    const all = allSections()
    expect(isFullSelection(all)).toBe(true)
    expect(all.has('departments')).toBe(false)
    expect(sectionState(all, 'departments')).toBe('on')
    expect(SECTION_IDS.every((id) => sectionState(all, id) === 'on')).toBe(true)
  })

  it('alt kutuyu kaldırmak ana kutuyu "mixed" yapar ve tam seçimi bozar', () => {
    const next = toggleSection(allSections(), 'meetings')
    expect(sectionState(next, 'departments')).toBe('mixed')
    expect(sectionState(next, 'meetings')).toBe('off')
    expect(isFullSelection(next)).toBe(false)
  })

  it('ana kutu alt kutuları toplu kaldırır; mixed iken hepsini işaretler', () => {
    const off = toggleSection(allSections(), 'departments')
    expect(DEPARTMENT_CHILDREN.every((c) => sectionState(off, c) === 'off')).toBe(true)
    expect(sectionState(off, 'departments')).toBe('off')
    const mixed = toggleSection(allSections(), 'files')
    const restored = toggleSection(mixed, 'departments')
    expect(isFullSelection(restored)).toBe(true)
  })

  it('üst düzey kutu çevrilir; girdi kümesi değişmez (saf)', () => {
    const before = allSections()
    const next = toggleSection(before, 'gantt')
    expect(before.has('gantt')).toBe(true)
    expect(next.has('gantt')).toBe(false)
    expect(isFullSelection(toggleSection(next, 'gantt'))).toBe(true)
  })

  it('alt kutular tanınır', () => {
    expect(isChild('tasks')).toBe(true)
    expect(isChild('summary')).toBe(false)
  })
})

describe('bölüm ve koordinatörlük seçiminin istek değerleri (BE-122, BE-127 kısmı)', () => {
  it('hepsi seçiliyse parametre yok; kısmi seçimde çizim sırasında yapraklar, "departments" hiç gitmez', () => {
    expect(sectionsForRequest(allSections())).toBeUndefined()
    const partial = toggleSection(toggleSection(allSections(), 'gantt'), 'files')
    expect(sectionsForRequest(partial)).toEqual([
      'summary',
      'general',
      'tasks',
      'details',
      'meetings',
      'appendix',
    ])
    expect(sectionsForRequest(partial)).not.toContain('departments')
  })

  it('boş seçim tanınır (sunucu onu "hepsi" sayar; istemci göndermez)', () => {
    expect(isEmptySelection(allSections())).toBe(false)
    expect(isEmptySelection(new Set())).toBe(true)
    expect(isEmptySelection(new Set(['departments']))).toBe(true)
  })

  it('koordinatörlük süzgeci: boş = Tümü (parametre yok); seçili olanlar programdaki sırayla', () => {
    const order = ['d1', 'd2', 'd3']
    expect(departmentsForRequest(new Set(), order)).toBeUndefined()
    expect(departmentsForRequest(new Set(['d3', 'd1']), order)).toEqual(['d1', 'd3'])
    expect(departmentsForRequest(new Set(['gone']), order)).toBeUndefined()
  })

  it('çip çevirme saf: ekler/çıkarır, girdiyi değiştirmez', () => {
    const before = new Set(['d1'])
    const next = toggleDepartment(before, 'd2')
    expect([...before]).toEqual(['d1'])
    expect([...next]).toEqual(['d1', 'd2'])
    expect([...toggleDepartment(next, 'd1')]).toEqual(['d2'])
  })
})
