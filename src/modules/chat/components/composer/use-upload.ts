/**
 * Dosya yükleme (E-10-55/102): TEK dosya (çoklu seçim yok; her dosya ayrı eylem ve ayrı
 * `client_message_id`). Metin alanındaki yazı varsa açıklama olarak gider (dosyadan ÖNCE parça).
 * İlerleme verisi yok → belirsiz çubuk. `file_too_large` / `file_rejected` / `input_invalid` alan
 * altında gösterilir (tavan sunucu yapılandırmasıdır; sayı yazılmaz). Karar sunucudadır.
 */
import { computed, ref } from 'vue'

import { errorText } from '@/shared/i18n'
import { notifyOutcome } from '@/shared/ui/confirm'

import { useSendChatAttachment } from '../../api/attachments'
import { newClientMessageId } from '../../model/message-state'
import type { ThreadContext } from '../thread/use-thread'
import { chatDrafts, settleSent } from './drafts'
import type { Notice } from './use-send'

type UploadOutcome = Awaited<ReturnType<ReturnType<typeof useSendChatAttachment>['submit']>>

/** Geç sonuç güncel sohbetin UI durumuna işlemez (KESİN 26): veri yalnız kendi anahtarına yazılır. */
function applyUpload(
  outcome: UploadOutcome,
  at: {
    key: string
    version: number | null
    thread: ThreadContext
    setNotice: (notice: Notice | null) => void
  },
): void {
  const current = at.thread.draftKey.value === at.key
  if (outcome.kind === 'success') {
    if (at.version !== null) settleSent(at.key, at.version)
    if (current) at.thread.stickBottom.value += 1
  } else if (outcome.kind === 'failed') {
    if (current) at.setNotice({ kind: 'error', text: errorText(outcome.error) })
  } else {
    notifyOutcome(outcome)
  }
}

export function useUpload(thread: ThreadContext, setNotice: (notice: Notice | null) => void) {
  const mutation = useSendChatAttachment()
  const uploadingKey = ref<string | null>(null)
  const uploading = computed(() => uploadingKey.value === thread.draftKey.value)

  async function upload(file: File): Promise<void> {
    if (uploading.value) return
    const key = thread.draftKey.value
    const chatId = thread.chatId.value
    const draft = chatDrafts.get(key)
    const version = draft ? chatDrafts.version(key) : null
    const caption = draft?.body.trim() || undefined
    uploadingKey.value = key
    setNotice(null)
    try {
      const outcome = await mutation.submit({
        programId: thread.programId.value,
        chatId,
        clientMessageId: newClientMessageId(),
        file,
        ...(caption ? { caption } : {}),
        ...(draft?.replyTo ? { replyToMessageId: draft.replyTo } : {}),
      })
      applyUpload(outcome, { key, version, thread, setNotice })
    } finally {
      if (uploadingKey.value === key) uploadingKey.value = null
    }
  }

  return { uploading, upload }
}
