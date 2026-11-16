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
import type { DeletedKind } from '../model/kinds'
import { deletedText } from '../model/messages'
import type { LifecycleAction } from '../model/outcome'
import type { DeletedRow } from '../model/types'
import { useBatchWrites, type BatchResult } from './use-batch-writes'

export interface BatchActionOptions {
  kind: () => DeletedKind
  /** Açık sekmenin listesini ve bağlı sorguları yeniden okur. */
  refresh: () => Promise<unknown>
  /** İşlem bitti: başarısız kimlikler seçili kalır; odak taşınır. */
  finished: (failedIds: readonly string[]) => void
}

export function batchConfirmOptions(
  action: LifecycleAction,
  kind: DeletedKind,
  rows: readonly DeletedRow[],
): ConfirmOptions {
  const n = rows.length
  const name = deletedText(`kindNames.${kind}`)
  const chunked = n > BATCH_LIMIT ? [deletedText('batch.chunked')] : []
  if (action === 'restore') {
    return {
      title: deletedText('batch.restoreTitle', { n, kind: name }),
      body: [
        deletedText('batch.restoreBody', { n }),
        deletedText(`confirm.restoreWarning.${kind}`),
        ...chunked,
      ],
      confirmLabel: deletedText('confirm.restoreConfirm'),
      tone: 'primary',
    }
  }
  return {
    title: deletedText('batch.purgeTitle', { n, kind: name }),
    body: [
      deletedText('batch.purgeBody'),
      ...(kind === 'gorev' ? [deletedText('batch.purgeFiles')] : []),
      ...chunked,
    ],
    confirmLabel: deletedText('confirm.purgeConfirm'),
    tone: 'danger',
  }
}

export function useBatchActions(options: BatchActionOptions) {
  const toast = useToast()
  const { confirmWrite } = useConfirm()
  const writes = useBatchWrites()
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

  async function start(action: LifecycleAction, rows: readonly DeletedRow[]) {
    if (writes.pending.value || rows.length === 0) return
    summary.value = null
    const kind = options.kind()
    const ids = rows.map((row) => row.id)
    const result = await confirmWrite(batchConfirmOptions(action, kind, rows), (context) =>
      writes.run(kind, action, ids, context),
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
