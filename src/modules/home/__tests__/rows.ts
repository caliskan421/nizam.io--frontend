// Saf model testleri için görev satırı fikstürü (msw'siz). Şemanın zorunlu alanları tam.
import type { WorkItem } from '@/modules/work/public'

let seq = 0

export function item(over: Partial<WorkItem> = {}): WorkItem {
  seq += 1
  return {
    work_item_id: `w${seq}`,
    program_id: 'p1',
    department_id: 'd1',
    title: `Görev ${seq}`,
    priority: 'orta',
    status: 'devam_ediyor',
    assignees: [],
    assignee_account_ids: [],
    start_on: '2026-10-01',
    end_on: '2026-10-30',
    is_overdue: false,
    days_overdue: 0,
    is_completed_late: false,
    days_late: 0,
    is_completed_early: false,
    days_early: 0,
    completion_evidence_required: false,
    subtask_counts: { total: 0, done: 0 },
    pending_date_request: null,
    created_at: '2026-10-01T08:00:00Z',
    created_by_account_id: 'acc-9',
    created_by_full_name: null,
    edit_revision: 1,
    dates_revision: 1,
    ...over,
  }
}

export function counts(
  over: {
    by?: Partial<Record<WorkItem['status'], number>>
    overdue?: number
    pending?: number
  } = {},
) {
  const by_status = {
    baslanmadi: 0,
    devam_ediyor: 0,
    onaya_sunuldu: 0,
    iade_edildi: 0,
    tamamlandi: 0,
    ...over.by,
  }
  return {
    by_status,
    total: Object.values(by_status).reduce((a, b) => a + b, 0),
    overdue: over.overdue ?? 0,
    pending_date_requests: over.pending ?? 0,
  }
}
