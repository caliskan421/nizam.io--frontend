/**
 * Düzenleme (E-10-46): yalnız gönderen; yazma alanı mesaj metniyle dolar, "Düzenleniyor" şeridi.
 * `expected_revision` son okunan `edit_revision`; 409 `messaging.edit_conflict` → ortak çakışma
 * kalıbı: yalnız gerçekten çakışan alan (gövde) sorulur — "benim değerim" yeni sürümle YENİ eylem
 * olarak gönderilir, "güncel değer" düzenlemeyi bırakır (otomatik tekrar yok). Bahsetme ve
 * referanslar düzenlemeyle değişmez.
 */
import { computed, ref } from 'vue'

import { errorText } from '@/shared/i18n'
import type { MutationOutcome } from '@/shared/http/mutation'
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

type EditOutcome = MutationOutcome<unknown, ChatMessage, ChatMessage | null>

/** Sonucu işler: `done` düzenleme bitti, mesaj = çözülecek çakışma, `null` bildirim yapıldı. */
function handleEdit(
  outcome: EditOutcome,
  again: boolean,
  setNotice: (n: Notice | null) => void,
): 'done' | ChatMessage | null {
  if (outcome.kind === 'success') return 'done'
  if (outcome.kind === 'failed' && outcome.error.code === 'messaging.message_not_found') {
    return 'done'
  }
  const conflict = outcome.kind === 'edit_conflict' && !again ? outcome.server : null
  if (conflict === null) {
    if (outcome.kind === 'failed') setNotice({ kind: 'error', text: errorText(outcome.error) })
    else notifyOutcome(outcome)
  }
  return conflict
}

function editVars(thread: ThreadContext, chatId: string, edit: EditDraft, seq: number) {
  return {
    programId: thread.programId.value,
    chatId,
    messageId: edit.messageId,
    seq,
    body: edit.body.trim(),
    expectedRevision: edit.expectedRevision,
  }
}

/** Geç sonuç güncel sohbetin bildirimine işlemez (KESİN 26); veri `at` anahtarına yazılır. */
function guard(thread: ThreadContext, at: string, setNotice: (notice: Notice | null) => void) {
  return (notice: Notice | null) => {
    if (thread.draftKey.value === at) setNotice(notice)
  }
}

/**
 * Kayıt durumu düzenleme HEDEFİ başınadır (anahtar + mesaj): vazgeçip başka mesajı düzenlemek serbest,
 * ilk kaydın sonucu yeni kipi ezmez (CX-F7-Ö-04).
 */
function useSaving(thread: ThreadContext) {
  const savingKey = ref<string | null>(null)
  const targetOf = (at: string, messageId: string | undefined) => `${at}:${messageId ?? ''}`
  const saving = computed(() => {
    const at = thread.draftKey.value
    return savingKey.value === targetOf(at, chatDrafts.getEdit(at)?.messageId)
  })
  return { savingKey, saving, targetOf }
}

export function useEdit(thread: ThreadContext, setNotice: (notice: Notice | null) => void) {
  const mutation = useEditChatMessage()
  const resolver = useConflictResolver()
  const page = useChatPage()
  const { savingKey, saving, targetOf } = useSaving(thread)
  const key = () => thread.draftKey.value

  /**
   * Düzenlemeyi bitirir: veri verilen ANAHTARA; bildirim yalnız hâlâ o sohbet açıksa (KESİN 26).
   * `version` verilmişse YALNIZ o düzenleme sürümü biter (CX-F7-Ö-04): geç başarı, sonradan
   * başlayan düzenlemeyi ve metnini silmez.
   */
  function finish(at: string = key(), version?: number): void {
    if (version !== undefined && chatDrafts.editVersion(at) !== version) return
    chatDrafts.endEdit(at)
    editBase.clear(at)
    if (key() === at) setNotice(null)
  }

  async function resolveConflict(
    server: ChatMessage,
    edit: EditDraft,
    seq: number,
    at: string,
    version: number,
  ): Promise<void> {
    const mine = edit.body.trim()
    const choice = await askConflict(resolver, editBase.get(at), mine, server)
    // Çakışma sorulurken düzenleme değiştiyse (vazgeçildi / başkası başladı) karar eskidir.
    if (choice === null || chatDrafts.editVersion(at) !== version) return
    if (choice === 'theirs') {
      await page.messages.refreshMessage(seq)
      return finish(at, version)
    }
    const next = {
      messageId: server.message_id,
      body: mine,
      expectedRevision: server.edit_revision,
    }
    chatDrafts.startEdit(at, next)
    editBase.set(at, server.body)
    await submit(true, at)
  }

  /** `again`: çakışma çözümünden sonraki TEK yeniden gönderim (döngü yok). */
  async function submit(again = false, at: string = key()): Promise<void> {
    const edit = chatDrafts.getEdit(at)
    if (!edit || savingKey.value === targetOf(at, edit.messageId) || edit.body.trim() === '') return
    const seq = thread.findMessage(edit.messageId)?.seq ?? 0
    const chatId = thread.chatId.value
    const version = chatDrafts.editVersion(at)
    const target = targetOf(at, edit.messageId)
    savingKey.value = target
    setNotice(null)
    const guarded = guard(thread, at, setNotice)
    let result: 'done' | ChatMessage | null
    try {
      result = handleEdit(
        await mutation.submit(editVars(thread, chatId, edit, seq)),
        again,
        guarded,
      )
    } finally {
      if (savingKey.value === target) savingKey.value = null
    }
    if (result === 'done') finish(at, version)
    else if (result !== null && key() === at) await resolveConflict(result, edit, seq, at, version)
  }

  return { saving, conflict: resolver, submit: () => submit(), cancel: () => finish() }
}
