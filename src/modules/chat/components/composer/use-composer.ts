/**
 * Yazma çubuğunun davranışı: alan (`use-field`), Ekle menüsü (`use-attach`), gönderim / düzenleme /
 * yükleme (`use-send`, `use-edit`, `use-upload`), öneri (`use-suggest`) ve klavye. Şablon
 * (`Composer.vue`) yalnız bağlar. Enter gönderir; Shift+Enter, bileşim ve dokunmatik girişte
 * yeni satır.
 */
import { computed, nextTick, ref, watch, type Ref } from 'vue'

import { useScopeStore } from '@/shared/scope/store'
import { useSessionStore } from '@/shared/session/store'

import type { ChatMessage } from '../../model/types'
import type { ThreadContext } from '../thread/use-thread'
import { chatDrafts, resetDrafts } from './drafts'
import { useAttach } from './use-attach'
import { useBand } from './use-band'
import { useEdit } from './use-edit'
import { useField } from './use-field'
import { useKeys } from './use-keys'
import { useSend, type Notice } from './use-send'
import { useSuggest } from './use-suggest'
import { useUpload } from './use-upload'

/** Yanıt bağı, odak isteği, kapsam/oturum değişimi ve sohbet değişimi sıfırlamaları. */
function useResets(
  thread: ThreadContext,
  props: { replyTo?: string },
  f: ReturnType<typeof useField>,
  menuOpen: Ref<boolean>,
  clearNotice: () => void,
): void {
  const scope = useScopeStore()
  const session = useSessionStore()
  watch(
    () => props.replyTo,
    (id) => {
      if (id && id !== f.draft.value?.replyTo) chatDrafts.setReplyTo(thread.draftKey.value, id)
    },
  )
  watch(() => thread.focusRequest.value, f.focusEnd)
  watch(() => [scope.programId, session.accountId], resetDrafts)
  watch(
    () => thread.draftKey.value,
    () => {
      clearNotice()
      menuOpen.value = false
      void nextTick(f.resize)
    },
  )
}

export function useComposer(
  thread: ThreadContext,
  props: { chatId: string; replyTo?: string },
  onSent: (message: ChatMessage) => void,
) {
  const extraNotice = ref<Notice | null>(null)
  const sender = useSend(thread, onSent)
  const editor = useEdit(thread, (n: Notice | null) => void (extraNotice.value = n))
  const uploader = useUpload(thread, (n: Notice | null) => void (extraNotice.value = n))
  const f = useField(
    thread,
    () => props.chatId,
    () => {
      extraNotice.value = null
      sender.bodyChanged()
    },
  )
  const attach = useAttach(thread, () => props.chatId, f.text, f.focusEnd, uploader.upload)
  const suggest = useSuggest(f.text, f.caret, thread)

  const showSuggest = computed(() => suggest.open.value && f.edit.value === null)
  const notice = computed(() => extraNotice.value ?? sender.notice.value)
  const busy = computed(
    () => sender.sending.value || editor.saving.value || uploader.uploading.value,
  )
  const canSend = computed(() => f.text.value.trim() !== '' && !busy.value)
  async function submit(): Promise<void> {
    if (!canSend.value) return
    extraNotice.value = null
    if (f.edit.value) await editor.submit()
    else await sender.submit()
    f.focusEnd()
  }

  const keys = useKeys({
    thread,
    text: f.text,
    editing: computed(() => f.edit.value !== null),
    suggest,
    showSuggest,
    setCaret: f.setCaret,
    submit,
    cancelEdit: editor.cancel,
  })

  useResets(thread, props, f, attach.menuOpen, () => void (extraNotice.value = null))

  return {
    ...attach,
    ...f,
    ...keys,
    sender,
    editor,
    uploader,
    suggest,
    showSuggest,
    notice,
    busy,
    canSend,
    ...useBand(thread),
    submit,
    cancelReply: () => chatDrafts.setReplyTo(thread.draftKey.value, null),
  }
}
