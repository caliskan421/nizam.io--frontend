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
import { deletedText } from './messages'
import type { DeletedAccount, DeletedDepartment, DeletedRow, DeletedWorkItem } from './types'

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

export function taskRow(item: DeletedWorkItem, ctx: RowContext): DeletedRow {
  const department = ctx.departmentName(item.department_id) ?? unknownDepartment()
  return {
    kind: 'gorev',
    id: item.work_item_id,
    key: `gorev:${item.work_item_id}`,
    title: item.title,
    code: null,
    subLine: deletedText('sub.task', { department }),
    deletedAt: item.deleted_at || null,
    actor: actorOf(item.deleted_by),
    departmentIds: [item.department_id],
    status: item.status,
    fileCount: item.file_count,
    place: null,
    inviteMode: null,
    departmentNames: [department],
    departmentKind: null,
    companyAdmin: false,
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
    kind: 'toplanti',
    id: meeting.meeting_id,
    key: `toplanti:${meeting.meeting_id}`,
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
    place: meeting.place,
    inviteMode: meeting.invite_mode,
    departmentNames: names,
    departmentKind: null,
    companyAdmin: false,
  }
}

export function departmentRow(department: DeletedDepartment): DeletedRow {
  return {
    kind: 'koordinatorluk',
    id: department.department_id,
    key: `koordinatorluk:${department.department_id}`,
    title: department.name,
    code: department.code || null,
    subLine: department.kind || '',
    // "Silinme zamanı okunamazsa boş" (şema): boş dize `null` olur.
    deletedAt: department.deleted_at || null,
    actor: actorOf(department.deleted_by),
    departmentIds: [department.department_id],
    status: null,
    fileCount: null,
    place: null,
    inviteMode: null,
    departmentNames: [],
    departmentKind: department.kind || null,
    companyAdmin: false,
  }
}

export function accountRow(account: DeletedAccount): DeletedRow {
  const teams = [...new Map(account.teams.map((team) => [team.department_id, team])).values()]
  const names = teams.map((team) => team.display_name)
  return {
    kind: 'kullanici',
    id: account.account_id,
    key: `kullanici:${account.account_id}`,
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
    place: null,
    inviteMode: null,
    departmentNames: names,
    departmentKind: null,
    companyAdmin: accountHoldsCompanyAdmin(account),
  }
}
