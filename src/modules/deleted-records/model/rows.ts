/**
 * Tür bazında satır alanları (E-12-66…69; `12-silinen-kayitlar/backend.md` §4). Dört silinen
 * listesi (görev, toplantı, koordinatörlük, hesap) tek satır modeline (`DeletedRow`) çevrilir;
 * alanlar yalnız liste öğesinden gelir (satır başına ayrıntı okuması yok). Veri olmayan alan
 * `null` / boştur — sahte ad, sayı, tarih üretilmez (ortak-kurallar §4). Arama sunucudadır (`q`):
 * satırda arama metni yoktur.
 */
import type { Meeting } from '@/modules/meetings/public'

import { accountHoldsCompanyAdmin } from './capabilities'
import { formatMeetingWhen } from './format'
import { recordKey } from './lifecycle'
import { deletedText } from './messages'
import type {
  DeletedAccount,
  DeletedDepartment,
  DeletedRow,
  DeletedTaskFacts,
  DeletedWorkItem,
} from './types'

export interface RowContext {
  timezone: string
  /** Koordinatörlük adı: program sözlüğü, yoksa silinmiş departman listesi; yoksa `null`. */
  departmentName: (departmentId: string) => string | null
}

export function unknownDepartment(): string {
  return deletedText('filters.department.unknown')
}

/** Silen: `deleted_by` (silen bilgisi tutulmadan önce silinmiş kayıtta null → ad boş). */
function actorOf(deletedBy: { account_id: string; full_name: string } | null) {
  return { accountId: deletedBy?.account_id ?? null, name: deletedBy?.full_name ?? '' }
}

/** Alt görev tamamlanma yüzdesi (yuvarlanmış); alt görev yoksa ilerleme uydurulmaz. */
function progressOf(counts: { total: number; done: number }): number | null {
  return counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : null
}

function taskFacts(item: DeletedWorkItem): DeletedTaskFacts {
  return {
    assignees: item.assignees.map((assignee) => assignee.full_name ?? ''),
    progress: progressOf(item.subtask_counts),
    subtasks: item.subtask_counts.total,
    notes: item.note_count,
    dateRequest: item.pending_date_request !== null,
    byDepartment: item.deleted_by_department,
  }
}

export function taskRow(item: DeletedWorkItem, ctx: RowContext): DeletedRow {
  const department = ctx.departmentName(item.department_id) ?? unknownDepartment()
  return {
    kind: 'tasks',
    rawKind: 'tasks',
    id: item.work_item_id,
    key: recordKey('tasks', item.work_item_id),
    title: item.title,
    code: null,
    subLine: deletedText(item.deleted_by_department ? 'sub.taskByDepartment' : 'sub.task', {
      department,
    }),
    deletedAt: item.deleted_at || null,
    actor: actorOf(item.deleted_by),
    departmentIds: [item.department_id],
    status: item.status,
    fileCount: item.file_count,
    task: taskFacts(item),
    place: null,
    inviteMode: null,
    departmentNames: [department],
    departmentKind: null,
    companyAdmin: false,
    parent: null,
    facts: [],
  }
}

export function meetingRow(meeting: Meeting, ctx: RowContext): DeletedRow {
  const ids = [
    ...new Set([meeting.owner_department_id, ...meeting.departments.map((d) => d.department_id)]),
  ]
  const nameOf = (id: string) =>
    ctx.departmentName(id) ??
    meeting.departments.find((d) => d.department_id === id)?.department_name ??
    unknownDepartment()
  const names = ids.map(nameOf)
  const owner = nameOf(meeting.owner_department_id)
  return {
    kind: 'meetings',
    rawKind: 'meetings',
    id: meeting.meeting_id,
    key: recordKey('meetings', meeting.meeting_id),
    title: meeting.title,
    code: null,
    subLine: deletedText('sub.meeting', {
      when: formatMeetingWhen(meeting.meeting_date, ctx.timezone),
      department: owner,
    }),
    deletedAt: meeting.deleted_at || null,
    actor: actorOf(meeting.deleted_by ?? null),
    departmentIds: ids,
    status: null,
    fileCount: null,
    task: null,
    place: meeting.place,
    inviteMode: meeting.invite_mode,
    departmentNames: names,
    departmentKind: null,
    companyAdmin: false,
    parent: null,
    facts: [],
  }
}

export function departmentRow(department: DeletedDepartment): DeletedRow {
  return {
    kind: 'departments',
    rawKind: 'departments',
    id: department.department_id,
    key: recordKey('departments', department.department_id),
    title: department.name,
    code: department.code || null,
    subLine: department.kind || '',
    // "Silinme zamanı okunamazsa boş" (şema): boş dize `null` olur.
    deletedAt: department.deleted_at || null,
    actor: actorOf(department.deleted_by),
    departmentIds: [department.department_id],
    status: null,
    fileCount: null,
    task: null,
    place: null,
    inviteMode: null,
    departmentNames: [],
    departmentKind: department.kind || null,
    companyAdmin: false,
    parent: null,
    facts: [],
  }
}

export function accountRow(account: DeletedAccount): DeletedRow {
  const teams = [...new Map(account.teams.map((team) => [team.department_id, team])).values()]
  const names = teams.map((team) => team.display_name)
  return {
    kind: 'accounts',
    rawKind: 'accounts',
    id: account.account_id,
    key: recordKey('accounts', account.account_id),
    title: account.full_name,
    code: null,
    // Silmede korunan ekip satırları (canlı departmanlar; ekipsiz hesapta boş).
    subLine: names.join(', '),
    // `deleted_at` boşsa (okunamadı) tarih "—" kalır; sunucu o satırı son güncelleme anına göre sıralar.
    deletedAt: account.deleted_at || null,
    actor: actorOf(account.deleted_by),
    departmentIds: teams.map((team) => team.department_id),
    status: null,
    fileCount: null,
    task: null,
    place: null,
    inviteMode: null,
    departmentNames: names,
    departmentKind: null,
    companyAdmin: accountHoldsCompanyAdmin(account),
    parent: null,
    facts: [],
  }
}
