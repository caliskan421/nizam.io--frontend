import { describe, expect, it } from 'vitest'

import { avatarText, initials } from './avatar'

const base = {
  kind: 'group',
  auto_kind: null,
  source: 'none',
  name: 'Eğitim Grubu',
  counterpart_name: null,
} as const

describe('avatarText', () => {
  it('Genel → G; koordinatörlük → 3 harf kod; serbest grup → 2 harf; birebir → karşı taraf', () => {
    expect(
      avatarText({
        chat: { ...base, auto_kind: 'general' },
        departmentCode: null,
        departmentName: null,
      }),
    ).toBe('G')
    expect(
      avatarText({
        chat: { ...base, auto_kind: 'department' },
        departmentCode: 'eleks',
        departmentName: 'Elektrik',
      }),
    ).toBe('ELE')
    expect(
      avatarText({
        chat: { ...base, auto_kind: 'department' },
        departmentCode: null,
        departmentName: 'Altyapı Tesisat Ekibi',
      }),
    ).toBe('ATE')
    expect(avatarText({ chat: base, departmentCode: null, departmentName: null })).toBe('EG')
    expect(
      avatarText({
        chat: { ...base, kind: 'direct', name: null, counterpart_name: 'ayşe yılmaz' },
        departmentCode: null,
        departmentName: null,
      }),
    ).toBe('AY')
  })
  it('ad yoksa boş', () => {
    expect(initials(null)).toBe('')
  })
})
