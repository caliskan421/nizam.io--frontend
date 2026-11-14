/**
 * Dosya yükleme (E-10-55/102): TEK dosya (çoklu seçim yok; her dosya ayrı eylem ve ayrı
 * `client_message_id`). Metin alanındaki yazı varsa açıklama olarak gider (dosyadan ÖNCE parça).
 * İlerleme verisi yok → belirsiz çubuk. `file_too_large` / `file_rejected` / `input_invalid` alan
 * altında gösterilir (tavan sunucu yapılandırmasıdır; sayı yazılmaz). Karar sunucudadır.
 */
import { ref } from 'vue'

import { errorText } from '@/shared/i18n'
import { notifyOutcome } from '@/shared/ui/confirm'

import { useSendChatAttachment } from '../../api/attachments'
import { newClientMessageId } from '../../model/message-state'
import type { ThreadContext } from '../thread/use-thread'
import { chatDrafts, clearChips } from './drafts'
import type { Notice } from './use-send'

export function useUpload(thread: ThreadContext, setNotice: (notice: Notice | null) => void) {
  const mutation = useSendChatAttachment()
  const uploading = ref(false)

  async function upload(file: File): Promise<void> {
    if (uploading.value) return
    const key = thread.draftKey.value
    const draft = chatDrafts.get(key)
    const caption = draft?.body.trim() || undefined
    uploading.value = true
    setNotice(null)
    try {
      const outcome = await mutation.submit({
        programId: thread.programId.value,
        chatId: thread.chatId.value,
        clientMessageId: newClientMessageId(),
        file,
        ...(caption ? { caption } : {}),
        ...(draft?.replyTo ? { replyToMessageId: draft.replyTo } : {}),
      })
      if (outcome.kind === 'success') {
        chatDrafts.clear(key)
        clearChips(key)
        thread.stickBottom.value += 1
      } else if (outcome.kind === 'failed') {
        setNotice({ kind: 'error', text: errorText(outcome.error) })
      } else {
        notifyOutcome(outcome)
      }
    } finally {
      uploading.value = false
    }
  }

  return { uploading, upload }
}
