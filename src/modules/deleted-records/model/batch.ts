/**
 * Toplu işlem mantığı (BE-114; ADR-0045): ≤100 kimlikli ardışık parçalar, kısmi başarı zarfının
 * birleştirilmesi ve kullanıcıya özet. Saf fonksiyonlar; metinler yalnız i18n'den (sunucu
 * `message` gösterilmez, hata kodu → cümle `batchFailureText`).
 */
import { deletedText } from './messages'
import { batchFailureText, type LifecycleAction } from './outcome'
import type { DeletedBatchResult, DeletedRow } from './types'

/** Tek istekte en çok kimlik (sözleşme: 1–100). */
export const BATCH_LIMIT = 100

export function chunk<T>(items: readonly T[], size: number = BATCH_LIMIT): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/** Birleştirilmiş sonuç: parçaların `succeeded` / `failed` listeleri sırayla eklenir. */
export interface BatchRun {
  succeeded: string[]
  failed: Array<{ id: string; code: string }>
}

export const emptyRun = (): BatchRun => ({ succeeded: [], failed: [] })

export function mergeRun(run: BatchRun, result: DeletedBatchResult): BatchRun {
  return {
    succeeded: [...run.succeeded, ...result.succeeded],
    failed: [...run.failed, ...result.failed],
  }
}

export interface BatchFailureLine {
  id: string
  title: string
  reason: string
}

/** Ekranda kalan özet: ne kadarı işlendi, hangi kayıt neden işlenemedi. */
export interface BatchSummary {
  message: string
  tone: 'success' | 'danger'
  failures: BatchFailureLine[]
}

/** Yalnız ilk 100 satır listelenir (bir isteğin tavanı); fazlası sayıda kalır. */
export function summarizeBatch(
  action: LifecycleAction,
  rows: readonly Pick<DeletedRow, 'id' | 'title'>[],
  run: BatchRun,
  interrupted: boolean,
): BatchSummary {
  const titles = new Map(rows.map((row) => [row.id, row.title]))
  const failures = run.failed.map(({ id, code }) => ({
    id,
    title: titles.get(id) ?? id,
    reason: batchFailureText(action, code),
  }))
  const done = run.succeeded.length
  const ok = deletedText(action === 'restore' ? 'batch.restored' : 'batch.purged', { n: done })
  if (interrupted) {
    return { message: deletedText('batch.interrupted', { n: done }), tone: 'danger', failures }
  }
  if (failures.length === 0) return { message: ok, tone: 'success', failures }
  const message =
    done === 0
      ? deletedText('batch.nothing', { bad: failures.length })
      : deletedText('batch.partial', { ok: done, bad: failures.length })
  return { message, tone: 'danger', failures }
}
