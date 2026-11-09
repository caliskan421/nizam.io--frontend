import { describe, expect, it } from 'vitest'

import { newTaskLocation, personUnits, taskLocation } from './assign'

const DEPARTMENTS = new Map([
  ['d1', { display_name: 'Mekanik', code: 'MEK' }],
  ['d2', { display_name: 'İdari işler' }],
])

describe('kişinin birimleri (E-05-44, E-05-48)', () => {
  it('yalnız seçili program; tekil; çözülemeyen kimlik ve bozuk etiket yok sayılır; ad sırası', () => {
    const user = {
      memberships: [
        'p1:d1:uye',
        'p1:d1:koordinator',
        'p1:d2:uye',
        'p2:d3:uye',
        'p1:d9:uye',
        'bozuk',
      ],
    }
    expect(personUnits(user, 'p1', DEPARTMENTS)).toEqual([
      { departmentId: 'd2', name: 'İdari işler', code: null },
      { departmentId: 'd1', name: 'Mekanik', code: 'MEK' },
    ])
    expect(personUnits({ memberships: null }, 'p1', DEPARTMENTS)).toEqual([])
    expect(personUnits(null, 'p1', DEPARTMENTS)).toBeNull()
    expect(personUnits(user, null, DEPARTMENTS)).toEqual([])
  })

  it('yeni görev girişi ve görev bağlantısı', () => {
    expect(newTaskLocation('d1', 'u1')).toEqual({
      name: 'work.tasks',
      query: { yeni: '1', koordinatorluk: 'd1', atanan: 'u1' },
    })
    expect(taskLocation('w1')).toEqual({ name: 'work.tasks', query: { gorev: 'w1' } })
  })
})
