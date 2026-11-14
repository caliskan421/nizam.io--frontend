/**
 * Gönderim (E-10-60): optimistik balon YOK — balon yalnız 201/200 ile akışa girer (yazma katmanı
 * pencereye işler). Gönderilirken düğme "Gönderiliyor" olur ve taslak alanda kalır. Ağ/5xx →
 * "Gönderim doğrulanamadı — Tekrar dene" (AYNI `client_message_id` + AYNI gövde; gövde değişirse
 * yeni eylem). Sonuç sınıflandırması `classifySend` (model/message-state).
 */
import { ref, watch, type Ref } from 'vue'

import { errorText } from '@/shared/i18n'
import type { MutationOutcome } from '@/shared/http/mutation'
import { notifyOutcome } from '@/shared/ui/confirm'

import { useSendChatMessage } from '../../api/writes'
import { useChatPage } from '../../model/context'
import { classifySend, type SendVerdict } from '../../model/message-state'
import type { ChatMessage, SendChatMessageRequest } from '../../model/types'
import type { ThreadContext } from '../thread/use-thread'
import { buildSendBody } from './send-body'
import { chatDrafts, chipsOf, clearChips } from './drafts'
import type { Draft } from '../../model/draft'

export type Notice =
  | { kind: 'unverified' }
  | { kind: 'deleted' }
  | { kind: 'mention' }
  | { kind: 'replyGone' }
  | { kind: 'rate' }
  | { kind: 'error'; text: string }

type SendOutcome = MutationOutcome<unknown, ChatMessage>
type Failed = Extract<SendVerdict, { state: 'failed' }>

/** Başarısız gönderimin ekrandaki bildirimi; `peer_left` bildirim değil, alan kapanmasıdır. */
function noticeOf(verdict: Failed, outcome: SendOutcome): Notice | null {
  switch (verdict.reason) {
    case 'unknown':
      return { kind: 'unverified' }
    case 'deleted':
      return { kind: 'deleted' }
    case 'mention_rejected':
      return { kind: 'mention' }
    case 'reply_gone':
      return { kind: 'replyGone' }
    case 'rate_limited':
      return { kind: 'rate' }
    case 'peer_left':
      return null
    default:
      return outcome.kind === 'failed' ? { kind: 'error', text: errorText(outcome.error) } : null
  }
}

function requestOf(thread: ThreadContext, draft: Draft): SendChatMessageRequest {
  return buildSendBody({
    body: draft.body,
    clientMessageId: draft.clientMessageId,
    replyTo: draft.replyTo,
    chips: chipsOf(thread.draftKey.value),
    allowAll: thread.caps.value?.mentionAll === true,
  })
}

interface SendState {
  sending: Ref<boolean>
  notice: Ref<Notice | null>
  peerLeft: Ref<boolean>
  retry: (() => Promise<SendOutcome>) | null
  /** Tekrarla gelen başarı yazma katmanının yerel yamasından geçmez: pencere yeniden okunur. */
  retried: boolean
  refresh: () => void
}

/** Sonucu ekrana uygular: başarıda taslak temizlenir; başarısızlıkta bildirim/alan kapanması. */
function applySend(
  thread: ThreadContext,
  state: SendState,
  outcome: SendOutcome,
  request: SendChatMessageRequest,
  onSent: (message: ChatMessage) => void,
): void {
  const verdict = classifySend(outcome, {
    chatKind: thread.chat.value?.kind ?? 'group',
    body: request,
  })
  state.retry = null
  if (verdict.state === 'sent') {
    chatDrafts.clear(thread.draftKey.value)
    clearChips(thread.draftKey.value)
    state.notice.value = null
    thread.stickBottom.value += 1
    onSent(verdict.message)
    if (state.retried) state.refresh()
    return
  }
  if (verdict.state !== 'failed') return
  if (verdict.reason === 'peer_left') state.peerLeft.value = true
  if (verdict.reason === 'reply_gone') chatDrafts.setReplyTo(thread.draftKey.value, null)
  if (verdict.reason === 'unknown' && outcome.kind === 'unknown_outcome')
    state.retry = outcome.retry
  state.notice.value = noticeOf(verdict, outcome)
  if (state.notice.value === null && outcome.kind !== 'failed' && verdict.reason !== 'peer_left') {
    notifyOutcome(outcome)
  }
}

export function useSend(thread: ThreadContext, onSent: (message: ChatMessage) => void) {
  const mutation = useSendChatMessage()
  const page = useChatPage()
  const state: SendState = {
    sending: ref(false),
    notice: ref(null),
    peerLeft: ref(false),
    retry: null,
    retried: false,
    refresh: () => void page.messages.loadNewer(),
  }

  watch(
    () => thread.chatId.value,
    () => {
      state.notice.value = null
      state.peerLeft.value = false
      state.retry = null
    },
  )

  async function run(start: () => Promise<SendOutcome>, request: SendChatMessageRequest) {
    state.sending.value = true
    try {
      applySend(thread, state, await start(), request, onSent)
    } finally {
      state.sending.value = false
    }
  }

  /** Taslağı gönderir (yeni kullanıcı eylemi: taslakla bağlı `client_message_id`). */
  async function submit(): Promise<void> {
    const draft = chatDrafts.get(thread.draftKey.value)
    if (state.sending.value || !draft || draft.body.trim() === '') return
    const request = requestOf(thread, draft)
    state.notice.value = null
    const body = { programId: thread.programId.value, chatId: thread.chatId.value, body: request }
    await run(() => mutation.submit(body), request)
  }

  /** "Tekrar dene": AYNI kimlik + AYNI gövde (K5). */
  async function retryUnknown(): Promise<void> {
    const again = state.retry
    const draft = chatDrafts.get(thread.draftKey.value)
    if (!again || state.sending.value || !draft) return
    state.retried = true
    try {
      await run(again, requestOf(thread, draft))
    } finally {
      state.retried = false
    }
  }

  /** Gövde değişti: bekleyen "doğrulanamadı" tekrarı ve bildirim yeni eyleme yer verir. */
  function bodyChanged(): void {
    state.retry = null
    const kind = state.notice.value?.kind
    if (kind === 'unverified' || kind === 'rate') state.notice.value = null
  }

  return {
    sending: state.sending,
    notice: state.notice,
    peerLeft: state.peerLeft,
    submit,
    retry: retryUnknown,
    bodyChanged,
  }
}
