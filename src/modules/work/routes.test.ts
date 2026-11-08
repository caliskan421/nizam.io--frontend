import { describe, expect, it } from 'vitest'

import { taskLink, TASKS_ROUTE, tasksQueryAfterScopeChange } from './routes'

describe('görev rotası davranışı', () => {
  it('kapsam değişince arama/sekme/talep/sıralama korunur; koordinatörlük ve gorev düşer', () => {
    expect(
      tasksQueryAfterScopeChange({
        durum: 'iade_edildi',
        talep: '1',
        q: 'rapor',
        sirala: 'bitis:artan',
        koordinatorluk: 'd2',
        gorev: 'w1',
        bilinmeyen: 'x',
      }),
    ).toEqual({ durum: 'iade_edildi', talep: '1', q: 'rapor', sirala: 'bitis:artan' })
  })

  it('görev bağlantısı /gorevler?gorev=<id> (E-03-55, P7)', () => {
    expect(TASKS_ROUTE).toEqual({ name: 'work.tasks', path: '/gorevler' })
    expect(taskLink('https://nizam.example', 'w 1')).toBe(
      'https://nizam.example/gorevler?gorev=w+1',
    )
  })
})
