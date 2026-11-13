import { describe, expect, it } from 'vitest'

import {
  activity,
  type ReportTask,
  departmentSections,
  distribution,
  lateness,
  SEASON_PRIORITIES,
  SEASON_STATUSES,
  taskDates,
  taskTotals,
} from './season-view'
import type { SeasonReport } from './types'

export function task(over: Partial<ReportTask> = {}): ReportTask {
  return {
    assignees: [],
    completed_on: null,
    created_at: '2026-03-01T08:00:00Z',
    created_by: { account_id: 'a', full_name: 'A' },
    days_early: 0,
    days_late: 0,
    days_overdue: 0,
    department_id: 'd1',
    department_name: 'Altyapı',
    dependency_count: 0,
    end_on: '2026-10-17',
    has_pending_dependency: false,
    is_completed_early: false,
    is_completed_late: false,
    is_overdue: false,
    note_count: 0,
    planned_end_on: null,
    priority: 'orta',
    start_on: '2026-09-01',
    status: 'devam_ediyor',
    title: 'Görev',
    work_item_id: 'w1',
    ...over,
  }
}

describe('görev sayımları', () => {
  it('tamamlanan geç/erken/zamanında bayraklardan; açık = toplam − tamamlanan', () => {
    const totals = taskTotals([
      task({ status: 'tamamlandi', is_completed_late: true, days_late: 2 }),
      task({ status: 'tamamlandi', is_completed_early: true, days_early: 1 }),
      task({ status: 'tamamlandi' }),
      task({ is_overdue: true, days_overdue: 4 }),
      task(),
    ])
    expect(totals).toEqual({
      total: 5,
      completed: 3,
      open: 2,
      overdue: 1,
      lateCompleted: 1,
      earlyCompleted: 1,
      onTimeCompleted: 1,
    })
  })

  it('boş küme sıfır', () => {
    expect(taskTotals([]).total).toBe(0)
  })
})

describe('dağılım', () => {
  it('eksik anahtar 0; genişlik toplama göre; sıra anahtar listesinin sırası', () => {
    const d = distribution(SEASON_STATUSES, { baslanmadi: 1, tamamlandi: 3 })
    expect(d.total).toBe(4)
    expect(d.rows.map((r) => r.key)).toEqual([...SEASON_STATUSES])
    expect(d.rows.find((r) => r.key === 'devam_ediyor')?.count).toBe(0)
    expect(d.rows.find((r) => r.key === 'tamamlandi')?.width).toBe(75)
    expect(distribution(SEASON_PRIORITIES, {}).total).toBe(0)
    expect(distribution(SEASON_PRIORITIES, {}).rows.every((r) => r.width === 0)).toBe(true)
  })
})

describe('gecikme ve tarih hücresi', () => {
  it('açık: gecikmiş / yok; tamamlanmış: geç / erken / zamanında', () => {
    expect(lateness(task({ is_overdue: true, days_overdue: 21 }))).toEqual({
      kind: 'overdue',
      days: 21,
    })
    expect(lateness(task())).toEqual({ kind: 'none', days: 0 })
    expect(lateness(task({ status: 'tamamlandi', is_completed_late: true, days_late: 2 }))).toEqual(
      {
        kind: 'late',
        days: 2,
      },
    )
    expect(
      lateness(task({ status: 'tamamlandi', is_completed_early: true, days_early: 3 })),
    ).toEqual({
      kind: 'early',
      days: 3,
    })
    expect(lateness(task({ status: 'tamamlandi' })).kind).toBe('ontime')
  })

  it('plan yalnız bitişten farklıysa', () => {
    expect(taskDates(task())).toEqual({ start: '01.09', end: '17.10', plan: null })
    expect(taskDates(task({ planned_end_on: '2026-09-30' })).plan).toBe('30.09')
    expect(taskDates(task({ planned_end_on: '2026-10-17' })).plan).toBeNull()
  })
})

const stat = (id: string, name: string, over: Record<string, unknown> = {}) => ({
  completed_tasks: 1,
  completion_rate: 50,
  coordinators: [{ account_id: 'c', full_name: 'Koord' }],
  department_id: id,
  in_progress_tasks: 1,
  kind: 'koordinatorluk',
  last_activity_at: null,
  meeting_count: 4,
  member_count: 3,
  name,
  not_started_tasks: 0,
  overdue_tasks: 1,
  total_tasks: 2,
  ...over,
})

describe('koordinatörlük bölümleri', () => {
  const season = {
    coordinatorship_performance: [
      stat('d2', 'Operasyon'),
      stat('d1', 'Altyapı ve tesisat', { description: 'Su ve elektrik' }),
    ],
    tasks: [
      task({ work_item_id: 'b', created_at: '2026-04-01T00:00:00Z' }),
      task({ work_item_id: 'a', created_at: '2026-03-01T00:00:00Z', status: 'tamamlandi' }),
      task({ work_item_id: 'x', department_id: 'd2' }),
    ],
  } as unknown as SeasonReport

  it('ada göre (Türkçe sıra), görevler created_at artan, kod kaynağı dışarıdan', () => {
    const sections = departmentSections(season, (id) => (id === 'd1' ? 'ALT' : null))
    expect(sections.map((s) => s.name)).toEqual(['Altyapı ve tesisat', 'Operasyon'])
    const alt = sections[0]!
    expect(alt.code).toBe('ALT')
    expect(sections[1]!.code).toBeNull()
    expect(alt.tasks.map((t) => t.work_item_id)).toEqual(['a', 'b'])
    expect(alt.description).toBe('Su ve elektrik')
    expect(alt.strip.find((r) => r.key === 'tamamlandi')?.count).toBe(1)
    expect(alt.totals).toMatchObject({ total: 2, completed: 1, overdue: 1 })
    expect(alt.memberCount).toBe(3)
    expect(alt.meetingCount).toBe(4)
  })
})

describe('aylık aktivite', () => {
  it('ay artan; toplam count toplamı; en yüksek ay; boş seri güvenli', () => {
    const season = {
      monthly_activity: [
        {
          month: '2026-06',
          count: 61,
          completed_tasks: 0,
          created_tasks: 0,
          meetings: 0,
          messages: 0,
        },
        {
          month: '2026-05',
          count: 20,
          completed_tasks: 0,
          created_tasks: 0,
          meetings: 0,
          messages: 0,
        },
      ],
    } as unknown as SeasonReport
    const a = activity(season)
    expect(a.rows.map((r) => r.month)).toEqual(['2026-05', '2026-06'])
    expect(a.total).toBe(81)
    expect(a.peak?.month).toBe('2026-06')
    expect(a.rows[1]!.height).toBe(100)
    expect(activity({ monthly_activity: [] } as unknown as SeasonReport)).toEqual({
      rows: [],
      total: 0,
      peak: null,
      max: 0,
    })
  })
})
