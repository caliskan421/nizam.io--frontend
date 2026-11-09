/**
 * Tek dosyanın eylemleri (E-03-61, E-03-35): indirme bileti, ad değiştir, sil. Her eylem
 * görevin KENDİ kapsamıyla gider (`targetOf`); yazmalar `useProtectedMutation`
 * sarmalayıcılarıyla, iyimser güncelleme yok (liste yalnız başarı sonrası yeniden okunur,
 * 03/03c/06 ortak `files` anahtarı). Sonuç metinleri i18n'den (`shared/ui/confirm`).
 *
 *  - İndirme: `issueDownloadTicket` → yanıt `url` hemen tarayıcıya verilir → mutasyon sonucu
 *    sıfırlanır (`finally`; bilet bellekte tutulmaz, hata yolunda da).
 *  - Sil: kalıcı → istemci onayı (`confirmWrite`, §7; `confirmation_required` yok); silme
 *    onayın yakaladığı bağlamla başlar (CX-F1-E-02).
 *  - Ad değiştir: sonuç çağırana döner (409 `records.name_taken` alanın altında gösterilir).
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { useToast } from '@/shared/ui'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'

import { useDeleteFile, useDownloadTicket, useRenameFile } from '../../api'
import { targetOf } from '../../model/target'
import type { FileRef, WorkItem, WorkItemFile } from '../../model/types'
import { redeemDownload } from './download'
import { filesText } from './messages'

type FileOf = Pick<WorkItemFile, 'file_id' | 'display_name'>
export type RenameOutcome = MutationOutcome<unknown, unknown, unknown>

export function useFileActions(item: MaybeRefOrGetter<WorkItem>, file: MaybeRefOrGetter<FileOf>) {
  const ticket = useDownloadTicket()
  const rename = useRenameFile()
  const remove = useDeleteFile()
  const { confirmWrite } = useConfirm()

  function ref(): FileRef {
    const current = toValue(item)
    return {
      target: targetOf(current),
      workItemId: current.work_item_id,
      fileId: toValue(file).file_id,
    }
  }

  async function download(): Promise<void> {
    const name = toValue(file).display_name
    const outcome = await ticket.submit(ref())
    if (outcome.kind !== 'success') {
      notifyOutcome(outcome)
      return
    }
    let opened: boolean
    try {
      opened = redeemDownload(outcome.data.url, name)
    } finally {
      // Bilet bellekte kalmaz: tarayıcıya verme istisna atsa da sonuç sıfırlanır (CX-F1-K-04).
      ticket.reset()
    }
    if (!opened) {
      useToast().push({ message: filesText('workFiles.row.downloadInvalid'), tone: 'danger' })
    }
  }

  async function del(): Promise<boolean> {
    const options = {
      title: filesText('workFiles.remove.title'),
      description: toValue(file).display_name,
      body: [filesText('workFiles.remove.body')],
      confirmLabel: filesText('workFiles.remove.confirm'),
      tone: 'danger' as const,
    }
    const outcome = await confirmWrite(options, (context) => remove.submit(ref(), { context }))
    if (outcome === null) return false
    if (outcome.kind === 'success') return true
    notifyOutcome(outcome)
    return false
  }

  function renameTo(displayName: string): Promise<RenameOutcome> {
    return rename.submit({ ...ref(), displayName })
  }

  return {
    download,
    remove: del,
    renameTo,
    busy: computed(
      () => ticket.isPending.value || rename.isPending.value || remove.isPending.value,
    ),
    renaming: rename.isPending,
  }
}
