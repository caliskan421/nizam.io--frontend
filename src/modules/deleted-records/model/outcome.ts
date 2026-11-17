/**
 * Yaşam döngüsü yazmasının sonucunun ekran yorumu (`12-silinen-kayitlar/mekanizma.md` §4;
 * `error-codes.json`). Saf fonksiyon: sonuç sınıfı + hata kodu → ne söylenir, liste yenilenir mi,
 * satır düşer mi. Metinler yalnız i18n'den (sunucu `message` gösterilmez). `null` ≡ ortak bildirim
 * (`notifyOutcome`) yeterli.
 *
 * Sonuç bilinmiyorsa (ağ, 5xx) kör tekrar YOK: korumalı yazma (`useKeylessMutation`) listeyi zaten
 * yeniden okur; burada yalnız kullanıcıya neyin belirsiz olduğu söylenir.
 */
import type { MutationOutcome } from '@/shared/http/mutation'

import { blockerPartsFromFields } from './impact'
import { deletedText } from './messages'
import type { DeletedRow } from './types'

export type LifecycleAction = 'restore' | 'purge'

export type Interpreted =
  | { kind: 'done'; message: string }
  /** Kayıt zaten istenen durumda / yok: başarı gibi, liste yenilenir. */
  | { kind: 'gone'; message: string }
  /** Durum değişmiş: mesaj + liste yenilenir. */
  | { kind: 'refresh'; message: string }
  /** Satır içi bildirim + Koordinatörlük sekmesine yol (görevin koordinatörlüğü silinmiş). */
  | { kind: 'notice'; message: string; departmentsLink: boolean }
  /** Kullanıcıya hata bildirimi (liste yenilenmez). */
  | { kind: 'error'; message: string; refresh: boolean }

const NOT_DELETED = new Set([
  'records.not_deleted',
  'work.not_deleted',
  'collaboration.not_deleted',
  'organization.not_deleted',
  'identity.not_deleted',
])
const NOT_FOUND = new Set([
  'records.file_not_found',
  'work.item_not_found',
  'collaboration.meeting_not_found',
  'organization.department_not_found',
  'identity.account_not_found',
  'organization.account_not_found',
])
const REQUIRES_DELETED = new Set([
  'records.permanent_requires_deleted',
  'work.permanent_requires_deleted',
  'collaboration.permanent_requires_deleted',
  'organization.permanent_requires_deleted',
  'identity.permanent_requires_deleted',
])

type AnyOutcome = MutationOutcome<unknown, unknown, unknown>

function filesDeleted(data: unknown): number {
  const value = (data as { files_deleted?: unknown } | null)?.files_deleted
  return typeof value === 'number' && value > 0 ? value : 0
}

function countOf(data: unknown, field: string): number | null {
  const value = (data as Record<string, unknown> | null)?.[field]
  return typeof value === 'number' && value >= 0 ? value : null
}

/** Departman kalıcı silme sonucu: yalnız sunucunun döndürdüğü sayılar (uydurma yok). */
function purgedDepartment(title: string, data: unknown): string | null {
  const parts = (
    ['work_items_deleted', 'files_deleted', 'program_links_removed', 'memberships_deleted'] as const
  ).flatMap((field) => {
    const n = countOf(data, field)
    return n === null ? [] : [deletedText(`impact.result.${field}`, { n })]
  })
  return parts.length > 0
    ? deletedText('feedback.purgedDepartment', { title, parts: parts.join(', ') })
    : null
}

/** v0.26 çocuk türlerin geri yükleme kapıları (ebeveyn çöpte, tavanlar, tamamlanmış görev). */
function childFailure(code: string): Interpreted | null {
  const key = CHILD_FAILURES[code]
  return key ? { kind: 'refresh', message: deletedText(`feedback.${key}`) } : null
}

type ChildFeedback =
  | 'parentTaskDeleted'
  | 'parentMeetingDeleted'
  | 'fileLimit'
  | 'subtaskLimit'
  | 'subtaskCompleted'
  | 'agendaLimit'
  | 'transferActive'

const CHILD_FAILURES: Readonly<Record<string, ChildFeedback>> = {
  'records.work_item_deleted': 'parentTaskDeleted',
  'work.item_deleted': 'parentTaskDeleted',
  'collaboration.meeting_deleted': 'parentMeetingDeleted',
  'records.too_many_files': 'fileLimit',
  'work.subtask_limit_reached': 'subtaskLimit',
  'work.item_completed': 'subtaskCompleted',
  'collaboration.agenda_limit_reached': 'agendaLimit',
  'records.transfer_active': 'transferActive',
}

export function failed(action: LifecycleAction, code: string): Interpreted | null {
  if (NOT_DELETED.has(code)) {
    return { kind: 'gone', message: deletedText('feedback.alreadyRestored') }
  }
  if (NOT_FOUND.has(code)) {
    return action === 'purge'
      ? { kind: 'gone', message: deletedText('feedback.alreadyGone') }
      : { kind: 'refresh', message: deletedText('feedback.notFound') }
  }
  if (REQUIRES_DELETED.has(code)) {
    return { kind: 'refresh', message: deletedText('feedback.notDeleted') }
  }
  const child = childFailure(code)
  if (child) return child
  if (code === 'work.department_unavailable') {
    return {
      kind: 'notice',
      message: deletedText('feedback.departmentUnavailable'),
      departmentsLink: true,
    }
  }
  if (code === 'organization.department_in_use') {
    return { kind: 'error', message: deletedText('feedback.departmentInUse'), refresh: false }
  }
  if (code === 'work.constraint_violation' || code === 'identity.account_referenced') {
    return { kind: 'error', message: deletedText('feedback.inUse'), refresh: false }
  }
  if (code === 'provisioning.write_not_allowed') {
    return { kind: 'error', message: deletedText('feedback.writeClosed'), refresh: false }
  }
  return null
}

function successOf(
  action: LifecycleAction,
  row: Pick<DeletedRow, 'kind' | 'title'>,
  data: unknown,
): Interpreted {
  const isDepartment = row.kind === 'departments'
  if (action === 'restore') {
    const restored = isDepartment ? countOf(data, 'work_items_restored') : null
    if (restored === null) {
      return { kind: 'done', message: deletedText('feedback.restored', { title: row.title }) }
    }
    const key = restored > 0 ? 'feedback.restoredDepartment' : 'feedback.restoredDepartmentNoTasks'
    return { kind: 'done', message: deletedText(key, { title: row.title, n: restored }) }
  }
  const department = isDepartment ? purgedDepartment(row.title, data) : null
  if (department) return { kind: 'done', message: department }
  const files = filesDeleted(data)
  return {
    kind: 'done',
    message:
      files > 0
        ? deletedText('feedback.purgedFiles', { title: row.title, n: files })
        : deletedText('feedback.purged', { title: row.title }),
  }
}

/** 409 `department_in_use`: `fields[]` bilinen engel türlerini sayıyla taşır; yoksa genel metin. */
function inUseOf(error: {
  fields: Parameters<typeof blockerPartsFromFields>[0]
}): Interpreted | null {
  const parts = blockerPartsFromFields(error.fields)
  if (!parts) return null
  const message = deletedText('feedback.departmentBlocked', { parts: parts.join(', ') })
  return { kind: 'error', message, refresh: false }
}

export function interpretOutcome(
  action: LifecycleAction,
  row: Pick<DeletedRow, 'kind' | 'title'>,
  outcome: AnyOutcome,
): Interpreted | null {
  if (outcome.kind === 'success') return successOf(action, row, outcome.data)
  if (outcome.kind === 'failed') {
    const inUse =
      outcome.error.code === 'organization.department_in_use' ? inUseOf(outcome.error) : null
    return inUse ?? failed(action, outcome.error.code)
  }
  // Görev kalıcı silmede ek temizlik hatası (500; GAP-052/WORK-K48): görev silinmiş kalır.
  if (outcome.kind === 'unknown_outcome' && action === 'purge' && row.kind === 'tasks') {
    return { kind: 'error', message: deletedText('feedback.purgeIncomplete'), refresh: true }
  }
  return null
}

/**
 * Toplu işlemde tek kimliğin hata kodu → kullanıcı cümlesi (tekil yazmayla aynı sözlük; sunucu
 * `message` alanı gösterilmez). Bilinmeyen kod nötr cümleye düşer.
 */
export function batchFailureText(action: LifecycleAction, code: string): string {
  if (code === 'organization.not_authorized') return deletedText('feedback.ownAccount')
  if (code === 'platform.conflict_retry') return deletedText('feedback.conflictRetry')
  return failed(action, code)?.message ?? deletedText('batch.generic')
}
