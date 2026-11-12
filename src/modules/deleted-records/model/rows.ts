/**
 * Tür bazında satır alanları (E-12-66…69; `12-silinen-kayitlar/backend.md` §4). Dört silinen
 * listesi (görev, toplantı, koordinatörlük, hesap) tek satır modeline (`DeletedRow`) çevrilir;
 * alanlar yalnız liste öğesinden gelir (satır başına ayrıntı okuması yok). Veri olmayan alan
 * `null` / boştur — sahte ad, sayı, tarih üretilmez (ortak-kurallar §4).
 */
import type { Meeting } from '@/modules/meetings/public'

import { formatMeetingWhen } from './format'
import { deletedText } from './messages'
import type { DeletedAccount, DeletedDepartment, DeletedRow, DeletedWorkItem } from './types'

export interface RowContext {
  timezone: string
  /** Koordinatörlük adı: program sözlüğü, yoksa silinmiş departman listesi; yoksa `null`. */
  departmentName: (departmentId: string) => string | null
}

const TR = 'tr-TR'

/** Arama katlaması (Türkçe: `İ`/`ı` farkı gözetilir). */
export function fold(text: string): string {
  return text.toLocaleLowerCase(TR)
}

function searchOf(...parts: ReadonlyArray<string | null | undefined>): string {
  return fold(parts.filter((p): p is string => !!p).join(' '))
}

export function unknownDepartment(): string {
  return deletedText('filters.department.unknown')
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
    actor: null,
    departmentIds: [item.department_id],
    searchText: searchOf(item.title),
    status: item.status,
    fileCount: item.file_count,
    place: null,
    inviteMode: null,
    departmentNames: [department],
    departmentKind: null,
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
  const actorName = meeting.deleted_by?.full_name ?? ''
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
    actor: { accountId: meeting.deleted_by?.account_id ?? null, name: actorName },
    departmentIds: ids,
    searchText: searchOf(meeting.title, actorName, ...names),
    status: null,
    fileCount: null,
    place: meeting.place,
    inviteMode: meeting.invite_mode,
    departmentNames: names,
    departmentKind: null,
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
    actor: null,
    departmentIds: [department.department_id],
    searchText: searchOf(department.name, department.code),
    status: null,
    fileCount: null,
    place: null,
    inviteMode: null,
    departmentNames: [],
    departmentKind: department.kind || null,
  }
}

export function accountRow(account: DeletedAccount): DeletedRow {
  return {
    kind: 'kullanici',
    id: account.account_id,
    key: `kullanici:${account.account_id}`,
    title: account.full_name,
    code: null,
    subLine: '',
    // Hesap satırında silinme tarihi ve silen yok (`created_at DESC` sırası; BE-118).
    deletedAt: null,
    actor: null,
    departmentIds: [],
    searchText: searchOf(account.full_name),
    status: null,
    fileCount: null,
    place: null,
    inviteMode: null,
    departmentNames: [],
    departmentKind: null,
  }
}
