import { describe, expect, it } from 'vitest'

import type { KnownUser, ProgramDepartment } from '../../model/types'
import { usersText } from './messages'
import { departmentNames, panelSubline, roleBadges, rowFromUser } from './user-rows'

const user = (id: string, name: string, memberships: string[] | null): KnownUser => ({
  account_id: id,
  full_name: name,
  memberships,
  account_status: 'active',
  company_admin: false,
  email: `${id}@example.test`,
  login_locked: false,
  teams: [],
})

const DEPTS = new Map<string, ProgramDepartment>([
  ['d1', { department_id: 'd1', display_name: 'Mekanik' }],
  ['d2', { department_id: 'd2', display_name: 'İdari işler' }],
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

  it('birleşik rol: aynı programda K + Ü → ilk rozet Koordinatör, +1 Üye (yönetici değilse Admin yok)', () => {
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

  it('hesap olguları sunucudan: e-posta, company_admin, account_status, login_locked (BE-041/042/044)', () => {
    const row = rowFromUser(
      {
        ...user('a', 'Ayşe', ['p1:d1:uye']),
        company_admin: true,
        account_status: 'disabled',
        login_locked: true,
      },
      'p1',
    )
    expect(row).toMatchObject({
      email: 'a@example.test',
      companyAdmin: true,
      accountStatus: 'disabled',
      loginLocked: true,
    })
  })

  it('şirket yöneticisi ilk rozet (Admin), ekip rolleri ardından (BE-042)', () => {
    const admin = { ...user('a', 'Ayşe', ['p1:d1:uye', 'p1:d2:koordinator']), company_admin: true }
    expect(roleBadges(rowFromUser(admin, 'p1'))).toEqual({
      first: 'admin',
      rest: ['coordinator', 'member'],
    })
    // Ekibi olmayan yönetici de Admin rozetiyle görünür (BE-045).
    expect(roleBadges(rowFromUser({ ...user('b', 'B', []), company_admin: true }, 'p1'))).toEqual({
      first: 'admin',
      rest: [],
    })
  })
})

describe('metinler', () => {
  it('yer tutucular doldurulur; ağaçta olmayan parça boş döner', () => {
    expect(usersText('users.pager.range', { to: 3, total: 185 })).toBe('1–3 / 185 kullanıcı')
    expect(usersText('users.table.open', { name: 'Ayşe' })).toBe('Ayşe ayrıntısını aç')
  })
})
