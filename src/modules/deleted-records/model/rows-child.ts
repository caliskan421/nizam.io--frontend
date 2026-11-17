/**
 * Çocuk türlerin (dosya, alt görev, görev notu, toplantı notu, gündem) ve birleşik listenin satır
 * eşlemesi (v0.26; ADR-0053/0054/0055). Alanlar yalnız liste öğesinden gelir (satır başına ek
 * okuma yok). Ad/başlık/ebeveyn adı yoksa kimlik ad olarak YAZILMAZ: boş kalır, arayüz nötr metin
 * kullanır. Birleşik satır yalnız `kind`, `id`, `name`, `department_id`, `parent`, `deleted_at`,
 * `deleted_by` taşır; görev gerçekleri (`task`) ve çocuk alanları o satırda yoktur (`null`/boş).
 */
import { recordKey, toLifecycleKind } from './lifecycle'
import type {
  DeletedAgendaItem,
  DeletedFile,
  DeletedMeetingNote,
  DeletedRecordItem,
  DeletedRow,
  DeletedSubtask,
  DeletedTaskNote,
  RowFact,
  RowParent,
} from './types'

interface Person {
  account_id: string
  full_name: string
}

const actorOf = (by: Person | null | undefined) => ({
  accountId: by?.account_id ?? null,
  name: by?.full_name ?? '',
})

/** Ortak satır iskeleti; çocuk mapper'ları yalnız farklı alanları verir. */
function base(
  kind: NonNullable<DeletedRow['kind']>,
  id: string,
  over: Partial<DeletedRow>,
): DeletedRow {
  return {
    kind,
    rawKind: kind,
    id,
    key: recordKey(kind, id),
    title: '',
    code: null,
    subLine: '',
    deletedAt: null,
    actor: { accountId: null, name: '' },
    departmentIds: [],
    status: null,
    fileCount: null,
    task: null,
    place: null,
    inviteMode: null,
    departmentNames: [],
    departmentKind: null,
    companyAdmin: false,
    parent: null,
    facts: [],
    ...over,
  }
}

const taskParent = (id: string, name: string | null, deleted: boolean): RowParent => ({
  kind: 'tasks',
  id,
  name: name || null,
  deleted,
})
const meetingParent = (id: string, name: string | null, deleted: boolean): RowParent => ({
  kind: 'meetings',
  id,
  name: name || null,
  deleted,
})

const fact = (label: string, value: string | null | undefined): RowFact[] =>
  value ? [{ label, value }] : []

/** Bayt → kısa metin (KB/MB); sunucu bayt sayısı dışında alan uydurulmaz. */
export function sizeText(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toFixed(1).replace('.', ',')} MB`
}

export function fileRow(item: DeletedFile): DeletedRow {
  return base('files', item.file_id, {
    title: item.display_name,
    code: item.work_item_code,
    subLine: item.work_item_title ?? '',
    deletedAt: item.deleted_at || null,
    actor: actorOf(item.deleted_by),
    departmentIds: [item.department_id],
    parent: taskParent(item.work_item_id, item.work_item_title, item.parent_deleted),
    facts: [
      ...fact('size', sizeText(item.size_bytes)),
      ...fact('contentType', item.content_type),
      ...fact('tag', item.tag),
      ...fact('uploader', item.uploaded_by.full_name),
    ],
  })
}

export function subtaskRow(item: DeletedSubtask): DeletedRow {
  return base('subtasks', item.subtask_id, {
    title: item.title,
    code: item.work_item_code,
    subLine: item.work_item_title,
    deletedAt: item.deleted_at || null,
    actor: actorOf(item.deleted_by),
    departmentIds: [item.department_id],
    parent: taskParent(item.work_item_id, item.work_item_title, item.parent_deleted),
    facts: [
      { label: 'done', value: item.done ? 'yes' : 'no' },
      ...fact('assignee', item.assigned_to?.full_name),
    ],
  })
}

export function taskNoteRow(item: DeletedTaskNote): DeletedRow {
  return base('task_notes', item.note_id, {
    title: item.excerpt,
    code: item.work_item_code,
    subLine: item.work_item_title,
    deletedAt: item.deleted_at || null,
    actor: actorOf(item.deleted_by),
    departmentIds: [item.department_id],
    parent: taskParent(item.work_item_id, item.work_item_title, item.parent_deleted),
    facts: fact('author', item.author?.full_name),
  })
}

export function meetingNoteRow(item: DeletedMeetingNote): DeletedRow {
  return base('meeting_notes', item.note_id, {
    title: item.excerpt,
    subLine: item.meeting_title,
    deletedAt: item.deleted_at || null,
    actor: actorOf(item.deleted_by),
    departmentIds: [item.owner_department_id],
    parent: meetingParent(item.meeting_id, item.meeting_title, item.parent_deleted),
    facts: [
      ...fact('author', item.author?.full_name),
      ...(item.converted_to_work_item_id ? [{ label: 'converted', value: 'yes' }] : []),
    ],
  })
}

export function agendaItemRow(item: DeletedAgendaItem): DeletedRow {
  return base('agenda_items', item.item_id, {
    title: item.title,
    subLine: item.meeting_title,
    deletedAt: item.deleted_at || null,
    actor: actorOf(item.deleted_by),
    departmentIds: [item.owner_department_id],
    parent: meetingParent(item.meeting_id, item.meeting_title, item.parent_deleted),
    facts: [{ label: 'checked', value: item.is_checked ? 'yes' : 'no' }],
  })
}

/** Ebeveyn türü: yalnız sözleşmedeki çoğul değerler tanınır (`tasks`, `meetings`). */
function parentOf(parent: DeletedRecordItem['parent']): RowParent | null {
  if (!parent) return null
  const kind = parent.kind === 'tasks' || parent.kind === 'meetings' ? parent.kind : null
  return { kind, id: parent.id, name: parent.name || null, deleted: parent.deleted }
}

/**
 * Birleşik liste öğesi → satır. Bilinmeyen (gelecek) `kind` salt okunur satır olur (`kind: null`,
 * `rawKind` ham); toplam sunucudan gelir, satır düşürülmez. Başlık yoksa boş kalır.
 */
export function recordRow(item: DeletedRecordItem): DeletedRow {
  const kind = toLifecycleKind(item.kind)
  return {
    ...base(kind ?? 'tasks', item.id, {}),
    kind,
    rawKind: item.kind,
    key: recordKey(item.kind, item.id),
    title: item.name,
    deletedAt: item.deleted_at || null,
    actor: actorOf(item.deleted_by),
    departmentIds: item.department_id ? [item.department_id] : [],
    parent: parentOf(item.parent),
    subLine: item.parent?.name ?? '',
  }
}
