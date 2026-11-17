/**
 * Satır ve panel eylemleri: Geri yükle / Kalıcı sil (E-12-35/36/53/58/59). Her eylem ortak onaydan
 * (`confirmWrite`) geçer ve onayın yakaladığı bağlamla gönderilir (KESİN 20). `Idempotency-Key`/
 * `expected_revision` yok, iyimser güncelleme yok: başarıda korumalı yazma listeyi yeniden okur.
 * Sahibi (sayfa) sökülmüş sonuç ekrana ulaşmaz (`reachesOwner`). `useToast`/`useConfirm` kurulumda
 * alınır (KESİN 26a); çağıran `setup` içinde çağırmalıdır.
 */
import { computed, ref } from 'vue'

import { reachesOwner } from '@/shared/http/mutation'
import { useToast } from '@/shared/ui'
import { notifyOutcome, useConfirm, type ConfirmOptions } from '@/shared/ui/confirm'

import { isChildKind } from '../model/lifecycle'
import { deletedText } from '../model/messages'
import { interpretOutcome, type LifecycleAction } from '../model/outcome'
import { interpretChildOutcome } from '../model/outcome-child'
import type { DeletedRow } from '../model/types'
import type { LifecycleHub } from './use-lifecycle-hub'
import { useDeleteImpact } from './use-delete-impact'
import { useLifecycleWrites, type LifecycleOutcome } from './use-lifecycle-writes'

export interface RecordNotice {
  message: string
  /** Koordinatörlük sekmesine yol sunulur (görevin koordinatörlüğü silinmiş). */
  departmentsLink: boolean
  /** Bilgi durumu (okuma sürüyor): `role=status`; yoksa `role=alert`. */
  status?: boolean
}

export interface RecordActionOptions {
  /** Açık sekmenin listesini yeniden okur. */
  refresh: () => Promise<unknown>
  /** Satır listeden düştü ya da düşmüş olabilir (seçim temizliği, odak taşıma). */
  removed: (row: DeletedRow) => void
  /** Sayfanın ortak yazma merkezi (verilmezse kurulur). */
  hub?: LifecycleHub
}

export function confirmOptions(action: LifecycleAction, row: DeletedRow): ConfirmOptions {
  if (action === 'restore') {
    return {
      title: deletedText('confirm.restoreTitle', { title: row.title }),
      body: [
        deletedText('confirm.restoreBody'),
        ...(row.kind ? [deletedText(`confirm.restoreWarning.${row.kind}`)] : []),
      ],
      confirmLabel: deletedText('confirm.restoreConfirm'),
      tone: 'primary',
    }
  }
  const files = row.fileCount ?? 0
  // Birleşik listeden gelen görev satırı dosya sayısı taşımaz: sayı uydurulmaz, genel uyarı verilir.
  const filesLine =
    files > 0
      ? [deletedText('confirm.purgeFiles', { n: files })]
      : row.kind === 'tasks' && row.fileCount === null
        ? [deletedText('confirm.purgeFilesAny')]
        : []
  return {
    title: deletedText('confirm.purgeTitle', { title: row.title }),
    body: [deletedText('confirm.purgeBody'), ...filesLine],
    confirmLabel: deletedText('confirm.purgeConfirm'),
    tone: 'danger',
  }
}

export function useRecordActions(options: RecordActionOptions) {
  const toast = useToast()
  const { confirmWrite } = useConfirm()
  const { senders, pending: writing } = useLifecycleWrites(options.hub)
  const impact = useDeleteImpact()
  // Etki okuması sürerken bütün yazma eylemleri mevcut meşgul yoluyla kilitlidir.
  const pending = computed(() => writing.value || impact.reading.value)
  const notice = ref<RecordNotice | null>(null)

  async function settle(action: LifecycleAction, row: DeletedRow, outcome: LifecycleOutcome) {
    if (!reachesOwner(outcome)) return
    // Çocuk türlerde başarı metni gerçek yanıttan (dosya geri yüklemede yeni ad) kurulur.
    const result =
      row.kind && isChildKind(row.kind)
        ? interpretChildOutcome(action, row.title || deletedText('row.untitled'), outcome)
        : interpretOutcome(action, row, outcome)
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
    const kind = row.kind
    // Bilinmeyen (gelecek) tür salt okunurdur: yazma yolu yoktur.
    if (pending.value || kind === null) return
    notice.value = null
    // Kalıcı koordinatörlük silme onayı etkiyle kurulur; okuma başarısız/engelli ise onay ve DELETE yoktur.
    const gone = () => options.refresh().then(() => options.removed(row))
    const gated =
      action === 'purge' && kind === 'departments'
        ? await impact.gate(row, confirmOptions(action, row), notice, gone)
        : { options: confirmOptions(action, row), context: undefined }
    if (gated === null) return
    const outcome = await confirmWrite(
      gated.options,
      (context) => senders[kind][action](row, context),
      { context: gated.context },
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
