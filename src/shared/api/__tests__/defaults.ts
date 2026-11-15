// Pin v0.23.0-api: yanıt şemalarına eklenen ZORUNLU alanların test varsayılanları — tek yer (W170, KESİN 36).
//
// Kural: alan uydurulmaz. Her varsayılan yalnız pinli spec'in o şemada `required` saydığı
// alandır; değer "alan yok/boş/sıfır" anlamına gelen en yalın değerdir (null, 0, false, []) ve
// UI'da gösterilmez. Testler bu üreticilerden geçer; pin eski sürüme dönerse yalnız burası değişir.
// Kullanım: `makeWorkItem({ title: 'x' })` — verilen alanlar varsayılanı ezer.
import type { components } from '../schema'

type S = components['schemas']

/** Spec'te zorunlu olup F8 öncesi fixture'larda olmayan alanlar (yalnız bunlar; gövdeyi test verir). */
export const NEW_WORK_ITEM_FIELDS = {
  sequence_no: 1,
  code: null,
  file_count: 0,
  submitted_at: null,
  submitted_by: null,
  extension_count: null,
  extended_days_total: null,
  has_pending_dependency: false,
  pending_dependency_count: 0,
  last_return: null,
} satisfies Pick<
  S['WorkItem'],
  | 'sequence_no'
  | 'code'
  | 'file_count'
  | 'submitted_at'
  | 'submitted_by'
  | 'extension_count'
  | 'extended_days_total'
  | 'has_pending_dependency'
  | 'pending_dependency_count'
  | 'last_return'
>

/** Eski biçimli (yeni alanları olmayan) görev/Gantt gövdesine yeni zorunlu alanları ekler. */
export function withWorkItemDefaults<T extends object>(base: T): T & typeof NEW_WORK_ITEM_FIELDS {
  return { ...NEW_WORK_ITEM_FIELDS, ...base }
}

const ZERO_TIME = '2026-01-01T00:00:00Z'

/** `FileRecord` / `FileListItem` / `WorkItemFileListItem` ortak yeni alanları. */
export function withFileDefaults<T extends object>(
  base: T,
): T & { created_at: string; department_id: string; uploaded_by_full_name: string | null } {
  return { created_at: ZERO_TIME, department_id: 'dep-1', uploaded_by_full_name: null, ...base }
}

export function makeFileRecord(over: Partial<S['FileRecord']> = {}): S['FileRecord'] {
  return {
    file_id: 'file-1',
    work_item_id: 'wi-1',
    display_name: 'dosya.pdf',
    content_type: 'application/pdf',
    size_bytes: 1,
    tag: 'sonuc',
    created_at: ZERO_TIME,
    ...over,
  }
}

/** Rol dizesi (K1 lint) çağıranın test dosyasında yazılır; bu yüzden `role` zorunludur. */
export function makeMyDepartment(
  over: Partial<S['MyDepartment']> & Pick<S['MyDepartment'], 'role'>,
): S['MyDepartment'] {
  return {
    program_id: 'prog-1',
    program_name: 'Program',
    department_id: 'dep-1',
    display_name: 'Departman',
    department_code: null,
    coordinators: [],
    ...over,
  }
}

export function makeMeetingDepartment(
  over: Partial<S['MeetingDepartment']> = {},
): S['MeetingDepartment'] {
  return {
    department_id: 'dep-1',
    department_name: 'Departman',
    department_code: null,
    deleted: false,
    ...over,
  }
}

export function makeTaskStatusDistribution(
  over: Partial<S['TaskStatusDistribution']> = {},
): S['TaskStatusDistribution'] {
  return {
    baslanmadi: 0,
    devam_ediyor: 0,
    onaya_sunuldu: 0,
    iade_edildi: 0,
    tamamlandi: 0,
    ...over,
  }
}

export function makeTaskPriorityDistribution(
  over: Partial<S['TaskPriorityDistribution']> = {},
): S['TaskPriorityDistribution'] {
  return { acil: 0, yuksek: 0, orta: 0, dusuk: 0, ...over }
}

export function makeArchiveFolder(over: Partial<S['ArchiveFolder']> = {}): S['ArchiveFolder'] {
  return {
    folder_id: 'folder-1',
    name: 'Klasör',
    file_count: 0,
    task_count: 0,
    total_bytes: 0,
    last_uploaded_at: null,
    is_virtual: false,
    ...over,
  }
}

export function makeArchiveTask(over: Partial<S['ArchiveTask']> = {}): S['ArchiveTask'] {
  return { work_item_id: 'wi-1', title: 'Görev', department_id: 'dep-1', file_count: 0, ...over }
}

export function makeDeletedBy(over: Partial<S['MeetingDeletedBy']> = {}): S['MeetingDeletedBy'] {
  return { account_id: 'acc-1', full_name: 'Silen Kişi', ...over }
}

export function makeMeetingNoteCounts(
  over: Partial<S['MeetingNoteCounts']> = {},
): S['MeetingNoteCounts'] {
  return { all: 0, converted: 0, mine: 0, ...over }
}

export function makeTaskCounters(over: Partial<S['TaskCounters']> = {}): S['TaskCounters'] {
  return {
    active: 0,
    overdue: 0,
    completed: 0,
    pending_approval: 0,
    returned: 0,
    total: 0,
    ...over,
  }
}

export function makeSeasonLimits(over: Partial<S['SeasonLimits']> = {}): S['SeasonLimits'] {
  return {
    tasks_total: 0,
    tasks_returned: 0,
    files_total: 0,
    files_returned: 0,
    notes_per_task: 5,
    ...over,
  }
}

export type MyDepartmentRole = S['MyDepartment']['role']

// --- Raporlar (BE-122…141; v0.22) --------------------------------------------------------------

/** `SeasonTask`/`ReportTask` yeni zorunlu alanları (F8 öncesi gövdelere eklenir). */
export function withReportTaskDefaults<T extends object>(
  base: T,
): T & Pick<S['SeasonTask'], 'sequence_no' | 'code' | 'file_count' | 'file_bytes' | 'detail'> {
  return { sequence_no: null, code: null, file_count: 0, file_bytes: 0, detail: null, ...base }
}

/** `SeasonCoordinatorshipStat` yeni zorunlu alanları. */
export function withSeasonDepartmentDefaults<T extends object>(
  base: T,
): T &
  Pick<
    S['SeasonCoordinatorshipStat'],
    | 'code'
    | 'file_bytes'
    | 'file_count'
    | 'late_completed_tasks'
    | 'members'
    | 'pending_approval_tasks'
    | 'returned_tasks'
  > {
  return {
    code: null,
    file_bytes: 0,
    file_count: 0,
    late_completed_tasks: 0,
    members: [],
    pending_approval_tasks: 0,
    returned_tasks: 0,
    ...base,
  }
}

/** `SeasonReport.stats` yeni zorunlu alanları. */
export function withSeasonStatsDefaults<T extends object>(
  base: T,
): T &
  Pick<
    S['SeasonReport']['stats'],
    | 'agenda_checked'
    | 'agenda_total'
    | 'early_completed_tasks'
    | 'late_completed_tasks'
    | 'total_admins'
    | 'total_attachment_bytes'
    | 'total_coordinators'
    | 'total_meeting_notes'
  > {
  return {
    agenda_checked: 0,
    agenda_total: 0,
    early_completed_tasks: 0,
    late_completed_tasks: 0,
    total_admins: 0,
    total_attachment_bytes: 0,
    total_coordinators: 0,
    total_meeting_notes: 0,
    ...base,
  }
}

/** `SeasonReport` üst düzey yeni zorunlu alanları. */
export function withSeasonReportDefaults<T extends object>(
  base: T,
): T &
  Pick<
    S['SeasonReport'],
    'program_year' | 'period' | 'meetings' | 'files' | 'workload_summary' | 'limits'
  > {
  return {
    program_year: null,
    period: null,
    meetings: [],
    files: [],
    workload_summary: [],
    limits: makeSeasonLimits(),
    ...base,
  }
}

/** `date_change_stats` yeni zorunlu alanları. */
export function withDateChangeDefaults<T extends object>(
  base: T,
): T & Pick<S['SeasonReport']['date_change_stats'], 'average_shift_days' | 'top_requested_tasks'> {
  return { average_shift_days: null, top_requested_tasks: [], ...base }
}

/** `MonthlyActivity` yeni zorunlu alanları. */
export function withMonthlyActivityDefaults<T extends object>(
  base: T,
): T & Pick<S['MonthlyActivity'], 'notes' | 'files' | 'date_requests'> {
  return { notes: 0, files: 0, date_requests: 0, ...base }
}

/** `ReportMeetingNote` yeni zorunlu alanları. */
export function withReportNoteDefaults<T extends object>(
  base: T,
): T & Pick<S['ReportMeetingNote'], 'converted_task_status' | 'converted_task_code'> {
  return { converted_task_status: null, converted_task_code: null, ...base }
}

/** `WorkItemSubtask` yeni zorunlu alanı. */
export function withSubtaskDefaults<T extends object>(
  base: T,
): T & Pick<S['WorkItemSubtask'], 'evidence_required'> {
  return { evidence_required: false, ...base }
}

// --- Silinenler (BE-108…119; v0.21) ------------------------------------------------------------

/** `DeletedWorkItem` yeni zorunlu alanları. */
export function withDeletedTaskDefaults<T extends object>(
  base: T,
): T &
  Pick<
    S['DeletedWorkItem'],
    | 'deleted_by_department'
    | 'deleted_by'
    | 'assignees'
    | 'subtask_counts'
    | 'note_count'
    | 'pending_date_request'
  > {
  return {
    deleted_by_department: false,
    deleted_by: null,
    assignees: [],
    subtask_counts: { total: 0, done: 0 },
    note_count: 0,
    pending_date_request: null,
    ...base,
  }
}

/** `DeletedDepartment` yeni zorunlu alanı. */
export function withDeletedDepartmentDefaults<T extends object>(
  base: T,
): T & Pick<S['DeletedDepartment'], 'deleted_by'> {
  return { deleted_by: null, ...base }
}

/** `DeletedAccount` yeni zorunlu alanları. */
export function withDeletedAccountDefaults<T extends object>(
  base: T,
): T & Pick<S['DeletedAccount'], 'deleted_by' | 'deleted_at' | 'company_admin' | 'teams'> {
  return {
    deleted_by: null,
    deleted_at: '2026-01-01T00:00:00Z',
    company_admin: false,
    teams: [],
    ...base,
  }
}

// --- Toplantılar (BE-021…068; v0.16) -----------------------------------------------------------

/** `Meeting` yeni zorunlu alanı. */
export function withMeetingDefaults<T extends object>(
  base: T,
): T & Pick<S['Meeting'], 'created_by_full_name'> {
  return { created_by_full_name: null, ...base }
}

/** `MeetingNoteList` yeni zorunlu alanları. */
export function withNoteListDefaults<T extends object>(
  base: T,
): T & Pick<S['MeetingNoteList'], 'total' | 'counts'> {
  return { total: 0, counts: makeMeetingNoteCounts(), ...base }
}

/** `DateRequest` (tarih talebi listesi satırı) yeni zorunlu alanları. */
export function withDateChangeRequestDefaults<T extends object>(
  base: T,
): T & Pick<S['DateChangeRequest'], 'created_at' | 'requested_by' | 'reviewed_at' | 'reviewed_by'> {
  return {
    created_at: ZERO_TIME,
    requested_by: { account_id: 'acc-1', full_name: null },
    reviewed_at: null,
    reviewed_by: null,
    ...base,
  }
}
