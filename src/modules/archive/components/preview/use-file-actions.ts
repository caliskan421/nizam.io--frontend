/**
 * Seçili dosyanın eylemleri (E-06-56, 58, 60): indirme (bilet akışı), etiket değiştirme, kalıcı
 * silme. Yeniden adlandırma `RenameFileDialog`'dadır. Her eylem dosyanın departmanıyla (`target`; S3) gider.
 *  - İndir: `useArchiveDownload` (bilet → hemen tüket); 429 `Retry-After` metni, otomatik tekrar
 *    yok; sahip söküldüyse (`disposed`) bilet tüketilmez, bildirim yok.

 *  - Etiketi değiştir (`retagFile`, BE-074): menüden bir etiket → anahtarsız PATCH; aynı etiket
 *    istek atmaz (bildirim: zaten bu etiketli); başarı → bildirim (liste/süzgeç sorguları motorun
 *    başarı geçersizlemesiyle yenilenir); hata → ortak bildirim.
 *  - Sil: kalıcı → istemci onayı `confirmWrite` ("Bu işlem geri alınamaz."); 204 → `deleted`;
 *    404 `records.file_not_found` → silinmiş say (`deleted`); diğer hata → ortak bildirim.
 * Bildirim kurulumda alınan `useToast()` ile yapılır; sökülmüş sahip UI/bildirim başlatmaz.
 */
import type { DownloadStartOptions } from '@/shared/download'

import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'

import { ownerLife } from '@/shared/http/mutation'
import { errorText } from '@/shared/i18n'
import { useToast } from '@/shared/ui'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'

import { useArchiveDownload } from '../../api/downloads'
import { fileGone, useDeleteArchiveFile, useRetagArchiveFile } from '../../api/writes'
import { tagView } from '../../model/tags'
import type {
  ArchiveDownloadResult,
  ArchiveFile,
  ArchiveTag,
  ArchiveTarget,
} from '../../model/types'
import { previewText } from './messages'

type FileSource = MaybeRefOrGetter<ArchiveFile>
type TargetSource = MaybeRefOrGetter<ArchiveTarget>

function waitText(retryAfter: number | null): string | null {
  return retryAfter === null
    ? null
    : previewText('archive.actions.downloadRetryAfter', { seconds: retryAfter })
}

/** İndirme sonucunun bildirimi (başarı, 429 beklemesi, sınıflı hata). */
function notifyDownload(result: ArchiveDownloadResult, toast: ReturnType<typeof useToast>): void {
  if (result.kind === 'saved') {
    toast.push({ message: previewText('archive.actions.downloadSaved', { name: result.fileName }) })
  } else if (result.kind === 'failed') {
    const message = waitText(result.retryAfter) ?? errorText(result.error)
    toast.push({ message, tone: 'danger' })
  } else if (result.kind === 'ticket_failed') {
    const outcome = result.outcome
    const wait = outcome.kind === 'failed' ? waitText(outcome.error.retryAfter) : null
    if (wait) toast.push({ message: wait, tone: 'danger' })
    else notifyOutcome(outcome)
  }
}

export function useFileDownload(
  file: FileSource,
  target: TargetSource,
  options?: () => DownloadStartOptions,
) {
  const download = useArchiveDownload()
  const owner = ownerLife()
  const toast = useToast()

  async function start(): Promise<ArchiveDownloadResult | undefined> {
    if (download.isPending.value) return
    const current = toValue(file)
    const result = await download.start(
      {
        target: toValue(target),
        kind: 'file',
        id: current.file_id,
        fallbackName: current.display_name,
      },
      options?.(),
    )
    if (owner.alive()) notifyDownload(result, toast)
    return result
  }
  return { start, pending: download.isPending }
}

export function useFileRetag(file: FileSource, target: TargetSource) {
  const retag = useRetagArchiveFile()
  const owner = ownerLife()
  const toast = useToast()

  async function start(tag: ArchiveTag): Promise<void> {
    if (retag.isPending.value) return
    const current = toValue(file)
    const label = tagView(tag).label
    if (current.tag === tag) {
      toast.push({ message: previewText('archive.actions.retaggedSame', { tag: label }) })
      return
    }
    const outcome = await retag.submit({
      target: toValue(target),
      workItemId: current.work_item_id,
      fileId: current.file_id,
      tag,
    })
    // Sökülmüş sahip bildirim/ek akış başlatmaz (ortak önbellek uzlaştırması motorda sürer).
    if (!owner.alive()) return
    if (outcome.kind === 'success') {
      toast.push({ message: previewText('archive.actions.retagged', { tag: label }) })
    } else notifyOutcome(outcome)
  }
  return { start, pending: retag.isPending }
}

export function useFileRemoval(
  file: FileSource,
  target: TargetSource,
  onDeleted: (fileId: string) => void,
) {
  const remove = useDeleteArchiveFile()
  const { confirmWrite } = useConfirm()
  const owner = ownerLife()
  const toast = useToast()

  /** İstek + sonuç işleme sürerken `true` (sayfa paneli bu sürede açık tutar). */
  const running = ref(false)

  async function run(): Promise<void> {
    if (remove.isPending.value) return
    const current = toValue(file)
    const ref = {
      target: toValue(target),
      workItemId: current.work_item_id,
      fileId: current.file_id,
    }
    const options = {
      title: previewText('archive.actions.removeTitle'),
      description: current.display_name,
      body: [previewText('archive.actions.removeBody')],
      confirmLabel: previewText('archive.actions.removeConfirm'),
      tone: 'danger' as const,
    }
    // Silme onayın yakaladığı bağlamla başlar (CX-F1-E-02); vazgeç/iptal → null, istek yok.
    const outcome = await confirmWrite(options, (context) => remove.submit(ref, { context }))
    if (outcome === null || !owner.alive()) return
    if (outcome.kind === 'success') {
      toast.push({ message: previewText('archive.actions.removed') })
      onDeleted(current.file_id)
    } else if (fileGone(outcome)) {
      toast.push({ message: previewText('archive.actions.removedAlready') })
      onDeleted(current.file_id)
    } else {
      notifyOutcome(outcome)
    }
  }
  async function start(): Promise<void> {
    running.value = true
    try {
      await run()
    } finally {
      running.value = false
    }
  }
  return { start, pending: remove.isPending, running }
}

export function useFileActions(
  file: FileSource,
  target: TargetSource,
  onDeleted: (fileId: string) => void,
) {
  const download = useFileDownload(file, target)
  const retag = useFileRetag(file, target)
  const removal = useFileRemoval(file, target, onDeleted)
  return {
    startDownload: download.start,
    startRetag: retag.start,
    startRemove: removal.start,
    downloading: download.pending,
    removing: removal.running,
    busy: computed(() => download.pending.value || retag.pending.value || removal.pending.value),
  }
}
