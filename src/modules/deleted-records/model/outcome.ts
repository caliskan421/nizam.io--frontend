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
  'work.not_deleted',
  'collaboration.not_deleted',
  'organization.not_deleted',
  'identity.not_deleted',
])
const NOT_FOUND = new Set([
  'work.item_not_found',
  'collaboration.meeting_not_found',
  'organization.department_not_found',
  'identity.account_not_found',
  'organization.account_not_found',
])
const REQUIRES_DELETED = new Set([
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

function failed(action: LifecycleAction, code: string): Interpreted | null {
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

export function interpretOutcome(
  action: LifecycleAction,
  row: Pick<DeletedRow, 'kind' | 'title'>,
  outcome: AnyOutcome,
): Interpreted | null {
  if (outcome.kind === 'success') {
    if (action === 'restore') {
      return { kind: 'done', message: deletedText('feedback.restored', { title: row.title }) }
    }
    const files = filesDeleted(outcome.data)
    return {
      kind: 'done',
      message:
        files > 0
          ? deletedText('feedback.purgedFiles', { title: row.title, n: files })
          : deletedText('feedback.purged', { title: row.title }),
    }
  }
  if (outcome.kind === 'failed') return failed(action, outcome.error.code)
  // Görev kalıcı silmede ek temizlik hatası (500; GAP-052/WORK-K48): görev silinmiş kalır.
  if (outcome.kind === 'unknown_outcome' && action === 'purge' && row.kind === 'gorev') {
    return { kind: 'error', message: deletedText('feedback.purgeIncomplete'), refresh: true }
  }
  return null
}
