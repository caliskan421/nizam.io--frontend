import { describe, expect, it } from 'vitest'

import { ganttTask } from '../../__tests__/harness'
import type { GanttTask } from '../../model/types'
import {
  filterTasks,
  isDone,
  isOverdue,
  matchesStatus,
  taskCounts,
  taskRange,
  weeklyHistogram,
  zoomIn,
  zoomOut,
} from './frame-model'

const late = { is_overdue: true, days_overdue: 4, is_completed_late: false, days_late: 0 }
const task = (over: Partial<GanttTask>): GanttTask => ganttTask(over)
const lateness = (over: Partial<GanttTask['lateness']>): GanttTask['lateness'] => ({
  ...ganttTask().lateness,
  ...over,
})

describe('sayaçlar (E-03C-02)', () => {
  it('görev / bitti / gecikmede; tamamlanmış geç görev gecikmede sayılmaz', () => {
    const tasks = [
      task({
        work_item_id: 'a',
        status: 'tamamlandi',
        lateness: lateness({ is_completed_late: true }),
      }),
      task({ work_item_id: 'b', status: 'tamamlandi', lateness: lateness({ is_overdue: true }) }),
      task({ work_item_id: 'c', lateness: lateness(late) }),
      task({ work_item_id: 'd' }),
    ]
    expect(taskCounts(tasks)).toEqual({ total: 4, done: 2, overdue: 1 })
    expect(isOverdue(tasks[1]!)).toBe(false)
    expect(isDone(tasks[1]!)).toBe(true)
  })

  it('boş küme sıfır', () => {
    expect(taskCounts([])).toEqual({ total: 0, done: 0, overdue: 0 })
  })
})

describe('durum ve departman süzgeci (E-03C-05/06)', () => {
  const tasks = [
    task({ work_item_id: 'a', department_id: 'd1', status: 'tamamlandi' }),
    task({ work_item_id: 'b', department_id: 'd1', lateness: lateness(late) }),
    task({ work_item_id: 'c', department_id: 'd2', status: 'iade_edildi' }),
  ]
  const ids = (list: GanttTask[]) => list.map((t) => t.work_item_id)

  it('dört durum değeri', () => {
    expect(ids(filterTasks(tasks, 'tumu', null))).toEqual(['a', 'b', 'c'])
    expect(ids(filterTasks(tasks, 'acik', null))).toEqual(['b', 'c'])
    expect(ids(filterTasks(tasks, 'geciken', null))).toEqual(['b'])
    expect(ids(filterTasks(tasks, 'biten', null))).toEqual(['a'])
  })

  it('tek departman süzgeci durumla birleşir', () => {
    expect(ids(filterTasks(tasks, 'tumu', 'd2'))).toEqual(['c'])
    expect(ids(filterTasks(tasks, 'acik', 'd1'))).toEqual(['b'])
    expect(matchesStatus(tasks[0]!, 'tumu')).toBe(true)
  })
})

describe('görev aralığı ve histogram (E-03C-14/15)', () => {
  const tasks = [
    task({ work_item_id: 'a', start_on: '2026-06-16', end_on: '2026-06-22' }),
    task({
      work_item_id: 'b',
      start_on: '2026-06-20',
      end_on: '2026-07-05',
      planned_end_on: '2026-07-10',
    }),
    task({
      work_item_id: 'c',
      start_on: '2026-07-01',
      end_on: '2026-07-03',
      completed_on: '2026-07-12',
    }),
  ]

  it('en erken başlangıç – en geç bitiş (planlanan ve tamamlanma dahil)', () => {
    expect(taskRange(tasks)).toEqual({ start: '2026-06-16', end: '2026-07-12' })
  })

  it('tarihli görev yoksa null; bozuk tarih yok sayılır', () => {
    expect(taskRange([])).toBeNull()
    expect(taskRange([task({ start_on: 'x', end_on: 'y' })])).toBeNull()
    expect(taskRange([task({ start_on: 'x', end_on: 'y' }), tasks[0]!])).toEqual({
      start: '2026-06-16',
      end: '2026-06-22',
    })
  })

  it('haftalık sayım aralık başından 7 günlük kovalarla', () => {
    const range = taskRange(tasks)!
    // 16 Haz – 12 Tem = 27 gün → 4 kova (16–22, 23–29, 30–6, 7–12)
    expect(weeklyHistogram(tasks, range)).toEqual([2, 1, 2, 2])
  })

  it('aralık yoksa boş', () => {
    expect(weeklyHistogram(tasks, null)).toEqual([])
  })
})

describe('ölçek adımı (E-03C-08/09)', () => {
  it('uzaklaştır gün → hafta → ay, sınırda sabit', () => {
    expect(zoomOut('gun')).toBe('hafta')
    expect(zoomOut('hafta')).toBe('ay')
    expect(zoomOut('ay')).toBe('ay')
  })

  it('yakınlaştır ay → hafta → gün, sınırda sabit', () => {
    expect(zoomIn('ay')).toBe('hafta')
    expect(zoomIn('hafta')).toBe('gun')
    expect(zoomIn('gun')).toBe('gun')
  })
})
