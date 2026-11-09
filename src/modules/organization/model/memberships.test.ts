import { describe, expect, it } from 'vitest'

import {
  membershipLabels,
  orderedRoles,
  parseMembershipLabel,
  programMemberships,
  programRoles,
} from './memberships'

describe('memberships etiket ayrıştırıcı (program:departman:rol, G16)', () => {
  it('geçerli etiket', () => {
    expect(parseMembershipLabel('p-1:d-1:koordinator')).toEqual({
      programId: 'p-1',
      departmentId: 'd-1',
      role: 'coordinator',
    })
    expect(parseMembershipLabel('p-1:d-1:uye')?.role).toBe('member')
  })

  it.each([
    ['', 'boş'],
    ['p-1:d-1', 'iki parça'],
    ['p-1:d-1:uye:fazla', 'dört parça'],
    [':d-1:uye', 'boş program'],
    ['p-1::uye', 'boş departman'],
    ['p-1:d-1:admin', 'bilinmeyen rol'],
    ['p-1:d-1:', 'boş rol'],
  ])('ayrıştırılamayan etiket yok sayılır: %s (%s)', (label) => {
    expect(parseMembershipLabel(label)).toBeNull()
  })

  it('memberships null → boş; bozuk etiketler atlanır', () => {
    expect(membershipLabels({ memberships: null })).toEqual([])
    expect(membershipLabels({ memberships: ['bozuk', 'p-1:d-1:uye'] })).toHaveLength(1)
  })

  it('yalnız seçili programın etiketleri (başka programın satırı gösterilmez, E-05-20)', () => {
    const user = { memberships: ['p-1:d-1:uye', 'p-2:d-9:koordinator', 'p-1:d-2:koordinator'] }
    expect(programMemberships(user, 'p-1').map((m) => m.departmentId)).toEqual(['d-1', 'd-2'])
    expect(programMemberships(user, null)).toEqual([])
    expect([...programRoles(user, 'p-2')]).toEqual(['coordinator'])
  })

  it('birleşik rol (aynı programda K + Ü) sırası Koordinatör → Üye (E-05-18)', () => {
    const user = { memberships: ['p-1:d-1:uye', 'p-1:d-2:koordinator'] }
    expect(orderedRoles(programRoles(user, 'p-1'))).toEqual(['coordinator', 'member'])
  })
})
