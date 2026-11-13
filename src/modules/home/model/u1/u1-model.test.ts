import { describe, expect, it } from 'vitest'

import { item } from '../../__tests__/rows'
import { calendarLegend, monthGrid } from './calendar'
import { unitBreakdown, unitWidths } from './departments'
import { actionTarget, queueActions, todayQueue } from './queue'

describe('Ü1 bugünün sırası (E-Ü1-09)', () => {
  it('iade > geciken (gün azalan) > öncelik > bitiş; onaya sunulanlar sona; tamamlananlar yok', () => {
    const ids = {
      back: item({ status: 'iade_edildi', title: 'iade' }),
      late9: item({ is_overdue: true, days_overdue: 9, title: 'late9' }),
      late2: item({ is_overdue: true, days_overdue: 2, title: 'late2' }),
      urgent: item({ priority: 'acil', title: 'urgent', end_on: '2026-12-01' }),
      high: item({ priority: 'yuksek', title: 'high', end_on: '2026-11-01' }),
      earlier: item({ priority: 'orta', title: 'earlier', end_on: '2026-11-01' }),
      later: item({ priority: 'orta', title: 'later', end_on: '2026-12-01' }),
      review: item({
        status: 'onaya_sunuldu',
        title: 'review',
        is_overdue: true,
        days_overdue: 50,
      }),
      done: item({ status: 'tamamlandi', title: 'done' }),
    }
    const queue = todayQueue(Object.values(ids), 20)
    expect(queue.shown.map((i) => i.title)).toEqual([
      'iade',
      'late9',
      'late2',
      'urgent',
      'high',
      'earlier',
      'later',
      'review',
    ])
    expect(queue.open).toBe(8)
    expect(todayQueue(Object.values(ids)).shown).toHaveLength(5)
  })

  it('eşitlikte ad sırası (tr)', () => {
    const q = todayQueue([item({ title: 'Çay' }), item({ title: 'Ankara' })])
    expect(q.shown.map((i) => i.title)).toEqual(['Ankara', 'Çay'])
  })

  it('eylemler duruma göre; hedef durum', () => {
    expect(queueActions({ status: 'iade_edildi' })).toEqual(['restart'])
    expect(queueActions({ status: 'devam_ediyor' })).toEqual(['evidence', 'complete'])
    expect(queueActions({ status: 'baslanmadi' })).toEqual(['start'])
    expect(queueActions({ status: 'onaya_sunuldu' })).toEqual([])
    expect(actionTarget('restart')).toBe('devam_ediyor')
    expect(actionTarget('complete')).toBe('onaya_sunuldu')
    expect(actionTarget('evidence')).toBeNull()
  })
})

describe('Ü1 takvim (E-Ü1-25…27)', () => {
  const TODAY = '2026-10-21'
  const items = [
    item({ end_on: '2026-10-21' }),
    item({ end_on: '2026-10-25' }),
    item({ end_on: '2026-10-05', is_overdue: true, days_overdue: 16 }),
    item({ end_on: '2026-10-05', status: 'tamamlandi' }),
  ]

  it('Pazartesi başlangıçlı ızgara; Ekim 2026 5 hafta; işaretler ve bugün', () => {
    const grid = monthGrid('2026-10', TODAY, items)
    expect(grid).toHaveLength(35)
    expect(grid[0]!.day).toBe('2026-09-28')
    expect(grid[0]!.inMonth).toBe(false)
    expect(grid.find((c) => c.today)!.day).toBe(TODAY)
    expect(grid.find((c) => c.day === '2026-10-21')).toMatchObject({
      upcoming: true,
      overdue: false,
    })
    expect(grid.find((c) => c.day === '2026-10-05')).toMatchObject({
      overdue: true,
      upcoming: false,
    })
    expect(grid.find((c) => c.day === '2026-10-06')).toMatchObject({
      overdue: false,
      upcoming: false,
    })
  })

  it('dört, beş ve altı haftalık aylar ve lejant sayıları', () => {
    expect(monthGrid('2027-02', TODAY, [])).toHaveLength(28)
    expect(monthGrid('2026-08', TODAY, [])).toHaveLength(42)
    expect(calendarLegend(items, TODAY)).toEqual({ overdue: 1, upcoming: 2 })
  })
})

describe('Ü1 koordinatörlüklerim (E-Ü1-31)', () => {
  it('birim kırılımı tek kümeden; sıra açık azalan sonra ad; dilim genişlikleri', () => {
    const units = [
      { departmentId: 'd1', displayName: 'Beta' },
      { departmentId: 'd2', displayName: 'Alfa' },
      { departmentId: 'd3', displayName: 'Boş' },
    ]
    const items = [
      item({ department_id: 'd1', status: 'devam_ediyor' }),
      item({ department_id: 'd1', status: 'onaya_sunuldu' }),
      item({ department_id: 'd1', status: 'iade_edildi', is_overdue: true, days_overdue: 1 }),
      item({ department_id: 'd1', status: 'baslanmadi' }),
      item({ department_id: 'd2', status: 'devam_ediyor' }),
      item({ department_id: 'd2', status: 'tamamlandi' }),
    ]
    const rows = unitBreakdown(units, items)
    expect(rows.map((r) => [r.name, r.open])).toEqual([
      ['Beta', 4],
      ['Alfa', 1],
      ['Boş', 0],
    ])
    expect(rows[0]).toMatchObject({ overdue: 1, doing: 1, review: 1, back: 1, notStarted: 1 })
    expect(unitWidths(rows[0]!)).toEqual({ todo: 25, doing: 25, review: 25, back: 25 })
    expect(unitWidths(rows[2]!)).toEqual({ todo: 0, doing: 0, review: 0, back: 0 })
  })
})
