import { describe, expect, it } from 'vitest'

import {
  allSections,
  DEPARTMENT_CHILDREN,
  isChild,
  isFullSelection,
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
