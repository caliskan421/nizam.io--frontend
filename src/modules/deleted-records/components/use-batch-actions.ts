/**
 * Toplu geri yükle / kalıcı sil eylemleri (E-12-21…23; BE-114): seçili satırlar için ortak onay
 * (`confirmWrite`; sayı ve tür adı onayda yazılır) ve onayın yakaladığı bağlamla ardışık ≤100'lük
 * istekler (KESİN 20). Sonuç kısmi başarıdır: başarısız her kayıt adı ve gerekçesiyle özette
 * kalır, başarısızlar seçili kalır; sistem hatasında liste yenilenir (işlenenler kalıcıdır).
 * Sahibi (sayfa) sökülmüş sonuç ekrana ulaşmaz (`reachesOwner`). `useToast`/`useConfirm`
 * kurulumda alınır (KESİN 26a); çağıran `setup` içinde çağırmalıdır.
 */
import { ref } from 'vue'

import { reachesOwner } from '@/shared/http/mutation'
import { useToast } from '@/shared/ui'
import { notifyOutcome, useConfirm, type ConfirmOptions } from '@/shared/ui/confirm'

import { BATCH_LIMIT, summarizeBatch, type BatchSummary } from '../model/batch'
import { PURGE_ORDER, RESTORE_ORDER, type LifecycleKind } from '../model/lifecycle'
import { deletedText } from '../model/messages'
import type { LifecycleAction } from '../model/outcome'
import type { DeletedRow } from '../model/types'
import type { LifecycleHub } from './use-lifecycle-hub'
import { useBatchWrites, type BatchResult } from './use-batch-writes'

export interface BatchActionOptions {
  /** Açık görünümün listesini ve bağlı sorguları yeniden okur. */
  refresh: () => Promise<unknown>
  /** İşlem bitti: başarısız satır ANAHTARLARI (`kind:id`) seçili kalır; odak taşınır. */
  finished: (failedKeys: readonly string[]) => void
  /** Sayfanın ortak yazma merkezi (verilmezse kurulur). */
  hub?: LifecycleHub
}

/** Seçimin yazma türü başına sayısı, eylemin tür sırasıyla. */
function countsOf(action: LifecycleAction, rows: readonly DeletedRow[]) {
  const order: readonly LifecycleKind[] = action === 'restore' ? RESTORE_ORDER : PURGE_ORDER
  const counts = new Map<LifecycleKind, number>()
  for (const row of rows) if (row.kind) counts.set(row.kind, (counts.get(row.kind) ?? 0) + 1)
  return order.filter((kind) => counts.has(kind)).map((kind) => ({ kind, n: counts.get(kind)! }))
}

export function batchConfirmOptions(
  action: LifecycleAction,
  rows: readonly DeletedRow[],
): ConfirmOptions {
  const n = rows.length
  const groups = countsOf(action, rows)
  const kinds = groups.map((group) => group.kind)
  const name = (kind: LifecycleKind) => deletedText(`lifecycleKinds.${kind}`)
  const summary = groups.map((group) => `${group.n} ${name(group.kind)}`).join(', ')
  const mixed = groups.length > 1
  const chunked = n > BATCH_LIMIT ? [deletedText('batch.chunked')] : []
  const accounts = kinds.includes('accounts')
  if (action === 'restore') {
    return {
      title: mixed
        ? deletedText('batch.restoreTitleMixed', { summary })
        : deletedText('batch.restoreTitle', { n, kind: name(kinds[0]!) }),
      body: [
        deletedText('batch.restoreBody', { n }),
        ...kinds.map((kind) => deletedText(`confirm.restoreWarning.${kind}`)),
        ...(accounts ? [deletedText('confirm.accountsScope')] : []),
        ...chunked,
      ],
      confirmLabel: deletedText('confirm.restoreConfirm'),
      tone: 'primary',
    }
  }
  return {
    title: mixed
      ? deletedText('batch.purgeTitleMixed', { summary })
      : deletedText('batch.purgeTitle', { n, kind: name(kinds[0]!) }),
    body: [
      deletedText('batch.purgeBody'),
      ...(kinds.includes('tasks') ? [deletedText('batch.purgeFiles')] : []),
      ...(accounts ? [deletedText('batch.accountsPurgeScope')] : []),
      ...chunked,
    ],
    confirmLabel: deletedText('confirm.purgeConfirm'),
    tone: 'danger',
  }
}

export function useBatchActions(options: BatchActionOptions) {
  const toast = useToast()
  const { confirmWrite } = useConfirm()
  const writes = useBatchWrites(options.hub)
  const summary = ref<BatchSummary | null>(null)

  async function settle(action: LifecycleAction, rows: readonly DeletedRow[], result: BatchResult) {
    const { run, stopped } = result
    if (stopped && !reachesOwner(stopped)) return
    if (stopped) {
      notifyOutcome(stopped)
      await options.refresh()
    }
    const interrupted = stopped !== null
    const made = summarizeBatch(action, rows, run, interrupted)
    if (made.tone === 'success') toast.push({ message: made.message })
    else summary.value = made
    options.finished(run.failed.map((line) => line.id))
  }

  async function start(action: LifecycleAction, selected: readonly DeletedRow[]) {
    // Bilinmeyen (gelecek) tür yazılamaz: seçime hiç girmez, yine de savunmacı süzülür.
    const rows = selected.filter((row) => row.kind !== null)
    if (writes.pending.value || rows.length === 0) return
    summary.value = null
    const result = await confirmWrite(batchConfirmOptions(action, rows), (context) =>
      writes.run(action, rows, context),
    )
    if (result !== null) await settle(action, rows, result)
  }

  return {
    pending: writes.pending,
    summary,
    dismissSummary: () => {
      summary.value = null
    },
    restore: (rows: readonly DeletedRow[]) => start('restore', rows),
    purge: (rows: readonly DeletedRow[]) => start('purge', rows),
  }
}
