// Gantt çekirdeği testleri için fikstürler (örnek veri, gerçek veri DEĞİLDİR).
import type { GanttLink, GanttTask } from '../types'

export function task(over: Partial<GanttTask> = {}): GanttTask {
  return {
    work_item_id: 'w1',
    title: 'Rapor',
    program_id: 'p1',
    department_id: 'd1',
    priority: 'orta',
    status: 'devam_ediyor',
    start_on: '2026-11-02',
    end_on: '2026-11-10',
    planned_end_on: '',
    completed_on: '',
    assignee_account_ids: [],
    dates_revision: 1,
    pending_date_request: null,
    subtask_counts: { total: 0, done: 0 },
    lateness: {
      is_overdue: false,
      days_overdue: 0,
      is_completed_late: false,
      days_late: 0,
      is_completed_early: false,
      days_early: 0,
    },
    ...over,
  }
}

export function link(over: Partial<GanttLink> = {}): GanttLink {
  return {
    dependency_id: 'l1',
    source: 'w1',
    target: 'w2',
    cross_department: false,
    ...over,
  }
}

/** n görevli, iki departmanlı örnek küme (deterministik). */
export function manyTasks(n: number): GanttTask[] {
  return Array.from({ length: n }, (_, i) =>
    task({
      work_item_id: `t${i}`,
      title: `Görev ${i}`,
      department_id: `d${i % 5}`,
      start_on: `2026-${String(6 + (i % 5)).padStart(2, '0')}-${String(1 + (i % 25)).padStart(2, '0')}`,
      end_on: `2026-${String(8 + (i % 4)).padStart(2, '0')}-${String(2 + (i % 24)).padStart(2, '0')}`,
    }),
  )
}
