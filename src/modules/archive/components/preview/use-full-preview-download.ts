import { computed, onScopeDispose, ref, watch } from 'vue'

import type { ArchiveDownloadResult, ArchiveTarget } from '../../model/types'
import { previewText } from './messages'
import { downloadFeedback, useFileDownload } from './use-file-actions'
import { isPreviewAccessFailure, type useFullPreviewResource } from './use-full-preview-resource'

function retrySeconds(result: ArchiveDownloadResult): number | null {
  if (result.kind === 'failed') return result.retryAfter
  if (result.kind === 'ticket_failed' && result.outcome.kind === 'failed') {
    return result.outcome.error.retryAfter
  }
  return null
}

function deniedDownload(result: ArchiveDownloadResult): boolean {
  return (
    result.kind === 'failed' &&
    result.error.code !== 'identity.download_ticket_invalid' &&
    isPreviewAccessFailure(result.error)
  )
}

export function useFullPreviewDownload(
  resource: ReturnType<typeof useFullPreviewResource>,
  target: ArchiveTarget,
) {
  const { record, canShowDetails, signal, deny, recheck } = resource
  const download = useFileDownload(() => record.value, target, {
    start: () => ({ signal, isCurrent: () => canShowDetails.value }),
    localFeedback: true,
  })
  const downloadNotice = ref<ReturnType<typeof downloadFeedback>>(null)
  const waiting = ref(false)
  const pending = computed(() => download.pending.value || waiting.value)
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  onScopeDispose(() => clearTimeout(retryTimer))
  watch(canShowDetails, (allowed) => {
    if (!allowed) downloadNotice.value = null
  })

  async function downloadFile(): Promise<void> {
    if (!canShowDetails.value || pending.value) return
    downloadNotice.value = null
    const result = await download.start()
    if (!result || !canShowDetails.value) return
    if (deniedDownload(result)) return deny()
    downloadNotice.value =
      result.kind === 'ticket_failed' && result.outcome.kind === 'unknown_outcome'
        ? { message: previewText('archive.fullscreen.downloadUnknown'), tone: 'danger' }
        : downloadFeedback(result)
    const seconds = retrySeconds(result)
    if (seconds && seconds > 0) {
      waiting.value = true
      retryTimer = setTimeout(() => {
        waiting.value = false
      }, seconds * 1000)
    }
    if (result.kind === 'failed' || result.kind === 'ticket_failed') recheck()
  }

  return { downloadFile, downloadNotice, pending }
}
