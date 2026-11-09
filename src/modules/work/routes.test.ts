import { describe, expect, it } from 'vitest'

import {
  taskLink,
  TASKS_QUERY_KEYS,
  TASKS_ROUTE,
  TASKS_STATUS_FILTERS,
  tasksQueryAfterScopeChange,
  workRoutes,
} from './routes'

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

  it('sayfa kaydı: work.tasks → TasksPage (S2), katalog adı ve yolu', async () => {
    expect(workRoutes).toHaveLength(1)
    const [record] = workRoutes
    expect(record).toMatchObject({ name: 'work.tasks', path: '/gorevler', meta: { scope: 'S2' } })
    const page = await (record!.component as () => Promise<{ default: { __name?: string } }>)()
    expect(page.default.__name).toBe('TasksPage')
  })

  it('süzgeç adları ve durum değerleri (Geciken + 5 durum)', () => {
    expect(TASKS_QUERY_KEYS).toEqual([
      'durum',
      'talep',
      'q',
      'koordinatorluk',
      'sirala',
      'gorev',
      'yeni',
    ])
    expect(TASKS_STATUS_FILTERS).toContain('iade_edildi')
    expect(TASKS_STATUS_FILTERS).toContain('geciken')
  })
})
