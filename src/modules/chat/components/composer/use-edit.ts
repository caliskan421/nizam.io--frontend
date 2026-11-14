/**
 * Düzenleme (E-10-46): yalnız gönderen; yazma alanı mesaj metniyle dolar, "Düzenleniyor" şeridi.
 * `expected_revision` son okunan `edit_revision`; 409 `messaging.edit_conflict` → ortak çakışma
 * kalıbı: yalnız gerçekten çakışan alan (gövde) sorulur — "benim değerim" yeni sürümle YENİ eylem
 * olarak gönderilir, "güncel değer" düzenlemeyi bırakır (otomatik tekrar yok). Bahsetme ve
 * referanslar düzenlemeyle değişmez.
 */
import { ref } from 'vue'

import { errorText } from '@/shared/i18n'
import { notifyOutcome } from '@/shared/ui/confirm'
import { resolveDraft, useConflictResolver } from '@/shared/ui/conflict'

import { useEditChatMessage } from '../../api/writes'
import { useChatPage } from '../../model/context'
import type { EditDraft } from '../../model/draft'
import type { ChatMessage } from '../../model/types'
import { chatText } from '../../messages'
import type { ThreadContext } from '../thread/use-thread'
import { chatDrafts, editBase } from './drafts'
import type { Notice } from './use-send'

type Resolver = ReturnType<typeof useConflictResolver>

/** Çakışma: gövde için "benim / güncel" seçtirilir (yalnız gerçek çakışma sorulur). */
async function askConflict(
  resolver: Resolver,
  base: string,
  mine: string,
  server: ChatMessage,
): Promise<'mine' | 'theirs' | null> {
  const choices = await resolver.resolve({
    base: { body: base },
    draft: { body: mine },
    server: { body: server.body },
    labels: { body: chatText('chat.composer.label') },
  })
  if (choices === null) return null
  return resolveDraft({ body: mine }, { body: server.body }, choices).body === undefined
    ? 'theirs'
    : 'mine'
}

export function useEdit(thread: ThreadContext, setNotice: (notice: Notice | null) => void) {
  const mutation = useEditChatMessage()
  const resolver = useConflictResolver()
  const page = useChatPage()
  const saving = ref(false)
  const key = () => thread.draftKey.value

  function finish(): void {
    chatDrafts.endEdit(key())
    editBase.clear(key())
    setNotice(null)
  }

  async function resolveConflict(server: ChatMessage, edit: EditDraft, seq: number): Promise<void> {
    const mine = edit.body.trim()
    const choice = await askConflict(resolver, editBase.get(key()), mine, server)
    if (choice === null) return
    if (choice === 'theirs') {
      await page.messages.refreshMessage(seq)
      return finish()
    }
    const next = {
      messageId: server.message_id,
      body: mine,
      expectedRevision: server.edit_revision,
    }
    chatDrafts.startEdit(key(), next)
    editBase.set(key(), server.body)
    await submit(true)
  }

  /** `again`: çakışma çözümünden sonraki TEK yeniden gönderim (döngü yok). */
  async function submit(again = false): Promise<void> {
    const edit = chatDrafts.getEdit(key())
    if (saving.value || !edit || edit.body.trim() === '') return
    const seq = thread.findMessage(edit.messageId)?.seq ?? 0
    saving.value = true
    setNotice(null)
    let conflict: ChatMessage | null = null
    try {
      const outcome = await mutation.submit({
        programId: thread.programId.value,
        chatId: thread.chatId.value,
        messageId: edit.messageId,
        seq,
        body: edit.body.trim(),
        expectedRevision: edit.expectedRevision,
      })
      if (outcome.kind === 'success') return finish()
      if (outcome.kind === 'edit_conflict') {
        conflict = again ? null : outcome.server
        if (conflict === null) notifyOutcome(outcome)
      } else if (outcome.kind !== 'failed') notifyOutcome(outcome)
      else if (outcome.error.code === 'messaging.message_not_found') return finish()
      else setNotice({ kind: 'error', text: errorText(outcome.error) })
    } finally {
      saving.value = false
    }
    if (conflict !== null) await resolveConflict(conflict, edit, seq)
  }

  return { saving, conflict: resolver, submit, cancel: finish }
}
