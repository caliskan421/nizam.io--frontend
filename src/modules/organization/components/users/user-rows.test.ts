import { describe, expect, it } from 'vitest'

import type { KnownUser, ProgramDepartment } from '../../model/types'
import { usersText } from './messages'
import {
  departmentNames,
  filterByTab,
  panelSubline,
  roleBadges,
  rowFromRoster,
  rowFromUser,
  searchRows,
  sortRows,
  tabCounts,
} from './user-rows'

const user = (id: string, name: string, memberships: string[] | null): KnownUser => ({
  account_id: id,
  full_name: name,
  memberships,
})

const DEPTS = new Map<string, ProgramDepartment>([
  ['d1', { department_id: 'd1', display_name: 'Mekanik' } as ProgramDepartment],
  ['d2', { department_id: 'd2', display_name: 'İdari işler' } as ProgramDepartment],
])

describe('satır modeli (seçili program etiketleri)', () => {
  it('yalnız seçili programın ayrıştırılabilen etiketleri; başka program ve bozuk etiket yok', () => {
    const row = rowFromUser(
      user('a', 'Ayşe', ['p1:d1:koordinator', 'p2:d9:uye', 'bozuk', 'p1::uye', 'p1:d2:admin']),
      'p1',
    )
    expect(row.labels).toEqual([{ programId: 'p1', departmentId: 'd1', role: 'coordinator' }])
  })

  it('memberships null ve program yok → etiket yok', () => {
    expect(rowFromUser(user('a', 'Ayşe', null), 'p1').labels).toEqual([])
    expect(rowFromUser(user('a', 'Ayşe', ['p1:d1:uye']), null).labels).toEqual([])
  })

  it('birleşik rol: aynı programda K + Ü → ilk rozet Koordinatör, +1 Üye (Admin yok)', () => {
    const row = rowFromUser(user('a', 'Ayşe', ['p1:d2:uye', 'p1:d1:koordinator']), 'p1')
    expect(roleBadges(row)).toEqual({ first: 'coordinator', rest: ['member'] })
    expect(roleBadges(rowFromUser(user('b', 'Berk', []), 'p1'))).toEqual({ first: null, rest: [] })
  })

  it('koordinatörlük adları programdaki adla; çözülemeyen kimlik gösterilmez', () => {
    const row = rowFromUser(user('a', 'Ayşe', ['p1:d1:uye', 'p1:d2:uye', 'p1:dx:uye']), 'p1')
    expect(departmentNames(row, DEPTS)).toEqual(['Mekanik', 'İdari işler'])
  })

  it('panel alt satırı: ilk birim + rol, çok birimde +n', () => {
    const one = rowFromUser(user('a', 'Ayşe', ['p1:d2:uye']), 'p1')
    expect(panelSubline(one, DEPTS)).toEqual({ first: 'İdari işler', more: 0, role: 'member' })
    const many = rowFromUser(user('a', 'Ayşe', ['p1:d1:koordinator', 'p1:d2:uye']), 'p1')
    expect(panelSubline(many, DEPTS)).toEqual({ first: 'Mekanik', more: 1, role: 'coordinator' })
    expect(panelSubline(rowFromUser(user('b', 'B', []), 'p1'), DEPTS)).toBeNull()
  })

  it('ekip satırından: önbellek varsa bütün etiketler, yoksa yalnız bu birim', () => {
    const member = {
      account_id: 'a',
      full_name: 'Ayşe',
      membership_id: 'm',
      role: 'uye',
      status: 'active' as const,
    }
    expect(rowFromRoster(member, 'p1', 'd1').labels).toEqual([
      { programId: 'p1', departmentId: 'd1', role: 'member' },
    ])
    const known = user('a', 'Ayşe', ['p1:d2:koordinator', 'p1:d1:uye'])
    expect(rowFromRoster(member, 'p1', 'd1', known).labels).toHaveLength(2)
  })
})

describe('sekmeler, arama, sıralama', () => {
  const rows = [
    rowFromUser(user('a', 'Işık Ünal', ['p1:d1:koordinator']), 'p1'),
    rowFromUser(user('b', 'ayşe kaya', ['p1:d2:uye']), 'p1'),
    rowFromUser(user('c', 'Cem', ['p2:d1:uye']), 'p1'),
  ]

  it('sekme süzmesi ve sayaçlar yüklenen kümede; Admin hiçbir satırla eşleşmez (BE-042)', () => {
    expect(filterByTab(rows, 'koordinator').map((r) => r.accountId)).toEqual(['a'])
    expect(filterByTab(rows, 'uye').map((r) => r.accountId)).toEqual(['b'])
    expect(filterByTab(rows, 'admin')).toEqual([])
    expect(tabCounts(rows)).toEqual({ tumu: 3, koordinator: 1, uye: 1 })
  })

  it('arama yalnız ad, Türkçe katlamalı (I/ı)', () => {
    expect(searchRows(rows, 'ışık').map((r) => r.accountId)).toEqual(['a'])
    expect(searchRows(rows, 'AYŞE').map((r) => r.accountId)).toEqual(['b'])
    expect(searchRows(rows, '  ')).toHaveLength(3)
  })

  it('ad sıralaması Türkçe, iki yön', () => {
    expect(sortRows(rows, 'asc').map((r) => r.accountId)).toEqual(['b', 'c', 'a'])
    expect(sortRows(rows, 'desc').map((r) => r.accountId)).toEqual(['a', 'c', 'b'])
  })
})

describe('metinler', () => {
  it('yer tutucular doldurulur; ağaçta olmayan parça boş döner', () => {
    expect(usersText('usersPage.pager.complete', { n: 3 })).toBe('3 kullanıcı')
    expect(usersText('usersPage.table.open', { name: 'Ayşe' })).toBe('Ayşe ayrıntısını aç')
  })
})
