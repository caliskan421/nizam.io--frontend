/**
 * Satır ve panel eylemleri: Geri yükle / Kalıcı sil (E-12-35/36/53/58/59). Her eylem ortak onaydan
 * (`confirmWrite`) geçer ve onayın yakaladığı bağlamla gönderilir (KESİN 20). `Idempotency-Key`/
 * `expected_revision` yok, iyimser güncelleme yok: başarıda korumalı yazma listeyi yeniden okur.
 * Sahibi (sayfa) sökülmüş sonuç ekrana ulaşmaz (`reachesOwner`). `useToast`/`useConfirm` kurulumda
 * alınır (KESİN 26a); çağıran `setup` içinde çağırmalıdır.
 */
import { ref } from 'vue'

import { reachesOwner } from '@/shared/http/mutation'
import { useToast } from '@/shared/ui'
import { notifyOutcome, useConfirm, type ConfirmOptions } from '@/shared/ui/confirm'

import { deletedText } from '../model/messages'
import { interpretOutcome, type LifecycleAction } from '../model/outcome'
import type { DeletedRow } from '../model/types'
import { useLifecycleWrites, type LifecycleOutcome } from './use-lifecycle-writes'

export interface RecordNotice {
  message: string
  /** Koordinatörlük sekmesine yol sunulur (görevin koordinatörlüğü silinmiş). */
  departmentsLink: boolean
}

export interface RecordActionOptions {
  /** Açık sekmenin listesini yeniden okur. */
  refresh: () => Promise<unknown>
  /** Satır listeden düştü ya da düşmüş olabilir (seçim temizliği, odak taşıma). */
  removed: (row: DeletedRow) => void
}

export function confirmOptions(action: LifecycleAction, row: DeletedRow): ConfirmOptions {
  if (action === 'restore') {
    return {
      title: deletedText('confirm.restoreTitle', { title: row.title }),
      body: [deletedText('confirm.restoreBody'), deletedText(`confirm.restoreWarning.${row.kind}`)],
      confirmLabel: deletedText('confirm.restoreConfirm'),
      tone: 'primary',
    }
  }
  const files = row.fileCount ?? 0
  return {
    title: deletedText('confirm.purgeTitle', { title: row.title }),
    body: [
      deletedText('confirm.purgeBody'),
      ...(files > 0 ? [deletedText('confirm.purgeFiles', { n: files })] : []),
    ],
    confirmLabel: deletedText('confirm.purgeConfirm'),
    tone: 'danger',
  }
}

export function useRecordActions(options: RecordActionOptions) {
  const toast = useToast()
  const { confirmWrite } = useConfirm()
  const { senders, pending } = useLifecycleWrites()
  const notice = ref<RecordNotice | null>(null)

  async function settle(action: LifecycleAction, row: DeletedRow, outcome: LifecycleOutcome) {
    if (!reachesOwner(outcome)) return
    const result = interpretOutcome(action, row, outcome)
    if (!result) {
      notifyOutcome(outcome)
      if (outcome.kind === 'unknown_outcome') await options.refresh()
      return
    }
    if (result.kind === 'notice') {
      notice.value = { message: result.message, departmentsLink: result.departmentsLink }
      return
    }
    if (result.kind === 'error') {
      toast.push({ message: result.message, tone: 'danger' })
      if (result.refresh) await options.refresh()
      return
    }
    toast.push({ message: result.message })
    // Başarıda korumalı yazma listeyi zaten yeniden okudu; "zaten yok/değişmiş" için okunur.
    if (result.kind !== 'done') await options.refresh()
    options.removed(row)
  }

  async function run(action: LifecycleAction, row: DeletedRow) {
    if (pending.value) return
    notice.value = null
    const outcome = await confirmWrite(confirmOptions(action, row), (context) =>
      senders[row.kind][action](row, context),
    )
    if (outcome === null) return
    await settle(action, row, outcome)
  }

  return {
    pending,
    notice,
    dismissNotice: () => {
      notice.value = null
    },
    restore: (row: DeletedRow) => run('restore', row),
    purge: (row: DeletedRow) => run('purge', row),
  }
}
