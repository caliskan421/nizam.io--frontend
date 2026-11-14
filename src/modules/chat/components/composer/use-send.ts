/**
 * Gönderim (E-10-60): optimistik balon YOK — balon yalnız 201/200 ile akışa girer (yazma katmanı
 * pencereye işler). Gönderilirken düğme "Gönderiliyor" olur ve taslak alanda kalır. Ağ/5xx →
 * "Gönderim doğrulanamadı — Tekrar dene" (AYNI `client_message_id` + AYNI gövde; gövde değişirse
 * yeni eylem). Sonuç sınıflandırması `classifySend` (model/message-state).
 */
import { computed, ref, watch, type Ref } from 'vue'

import { errorText } from '@/shared/i18n'
import type { MutationOutcome } from '@/shared/http/mutation'
import { notifyOutcome } from '@/shared/ui/confirm'

import { useSendChatMessage } from '../../api/writes'
import { useChatPage } from '../../model/context'
import { classifySend, type SendVerdict } from '../../model/message-state'
import type { ChatMessage, SendChatMessageRequest } from '../../model/types'
import type { ThreadContext } from '../thread/use-thread'
import { buildSendBody } from './send-body'
import { chatDrafts, chipsOf, settleSent } from './drafts'
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

function requestOf(thread: ThreadContext, key: string, draft: Draft): SendChatMessageRequest {
  return buildSendBody({
    body: draft.body,
    clientMessageId: draft.clientMessageId,
    replyTo: draft.replyTo,
    chips: chipsOf(key),
    allowAll: thread.caps.value?.mentionAll === true,
  })
}

/** Gönderimin başladığı an: sonuç yalnız bu anahtara/sohbete bağlanır (geç sonuç başka sohbete işlemez). */
interface Origin {
  key: string
  chatId: string
  /** Gönderilen taslak gövdesi (ham): yalnız bu sürüm temizlenir. */
  body: string
  /** Sohbet türü gönderim anındaki (sonuç sınıflandırması güncel sohbete bakmaz). */
  chatKind: 'direct' | 'group'
}

interface SendState {
  /** Gönderimi süren taslak anahtarı (başka sohbette "Gönderiliyor" görünmez). */
  sendingKey: Ref<string | null>
  notice: Ref<Notice | null>
  peerLeft: Ref<boolean>
  retry: (() => Promise<SendOutcome>) | null
  /** Tekrarla gelen başarı yazma katmanının yerel yamasından geçmez: pencere yeniden okunur. */
  retried: boolean
  refresh: () => void
}

/** Veri: yalnız gönderilen anahtar/sürüm temizlenir; UI: yalnız hâlâ o sohbet açıksa. */
function applySent(thread: ThreadContext, state: SendState, origin: Origin): void {
  settleSent(origin.key, origin.body)
  if (thread.draftKey.value !== origin.key) return
  state.notice.value = null
  thread.stickBottom.value += 1
  if (state.retried) state.refresh()
}

function applyFailed(
  thread: ThreadContext,
  state: SendState,
  origin: Origin,
  verdict: Failed,
  outcome: SendOutcome,
): void {
  if (verdict.reason === 'reply_gone') chatDrafts.setReplyTo(origin.key, null)
  // Geç sonuç güncel sohbetin UI durumuna işlemez (KESİN 26); veri yukarıda anahtarına yazıldı.
  if (thread.draftKey.value !== origin.key) return
  if (verdict.reason === 'peer_left') state.peerLeft.value = true
  if (verdict.reason === 'unknown' && outcome.kind === 'unknown_outcome')
    state.retry = outcome.retry
  state.notice.value = noticeOf(verdict, outcome)
  if (state.notice.value === null && outcome.kind !== 'failed' && verdict.reason !== 'peer_left') {
    notifyOutcome(outcome)
  }
}

/** Sonucu ekrana uygular: başarıda taslak temizlenir; başarısızlıkta bildirim/alan kapanması. */
function applySend(
  thread: ThreadContext,
  state: SendState,
  origin: Origin,
  outcome: SendOutcome,
  request: SendChatMessageRequest,
  onSent: (message: ChatMessage) => void,
): void {
  const verdict = classifySend(outcome, {
    chatKind: origin.chatKind,
    body: request,
  })
  const current = thread.draftKey.value === origin.key
  if (current) state.retry = null
  if (verdict.state === 'sent') {
    applySent(thread, state, origin)
    if (current) onSent(verdict.message)
  } else if (verdict.state === 'failed') {
    applyFailed(thread, state, origin, verdict, outcome)
  }
}

function originOf(thread: ThreadContext, key: string, draft: Draft): Origin {
  return {
    key,
    chatId: thread.chatId.value,
    body: draft.body,
    chatKind: thread.chat.value?.kind ?? 'group',
  }
}

function createState(thread: ThreadContext, refresh: () => void): SendState {
  const state: SendState = {
    sendingKey: ref(null),
    notice: ref(null),
    peerLeft: ref(false),
    retry: null,
    retried: false,
    refresh,
  }
  watch(
    () => thread.chatId.value,
    () => {
      state.notice.value = null
      state.peerLeft.value = false
      state.retry = null
    },
  )
  return state
}

export function useSend(thread: ThreadContext, onSent: (message: ChatMessage) => void) {
  const mutation = useSendChatMessage()
  const page = useChatPage()
  const state = createState(thread, () => void page.messages.loadNewer())

  const sending = computed(() => state.sendingKey.value === thread.draftKey.value)

  async function run(
    start: () => Promise<SendOutcome>,
    origin: Origin,
    request: SendChatMessageRequest,
  ) {
    state.sendingKey.value = origin.key
    try {
      applySend(thread, state, origin, await start(), request, onSent)
    } finally {
      if (state.sendingKey.value === origin.key) state.sendingKey.value = null
    }
  }

  /** Taslağı gönderir (yeni kullanıcı eylemi: taslakla bağlı `client_message_id`). */
  async function submit(): Promise<void> {
    const key = thread.draftKey.value
    const draft = chatDrafts.get(key)
    if (sending.value || !draft || draft.body.trim() === '') return
    const origin = originOf(thread, key, draft)
    const request = requestOf(thread, origin.key, draft)
    state.notice.value = null
    const body = { programId: thread.programId.value, chatId: origin.chatId, body: request }
    await run(() => mutation.submit(body), origin, request)
  }

  /** "Tekrar dene": AYNI kimlik + AYNI gövde (K5). */
  async function retryUnknown(): Promise<void> {
    const again = state.retry
    const key = thread.draftKey.value
    const draft = chatDrafts.get(key)
    if (!again || sending.value || !draft) return
    const origin = originOf(thread, key, draft)
    state.retried = true
    try {
      await run(again, origin, requestOf(thread, origin.key, draft))
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
    sending,
    notice: state.notice,
    peerLeft: state.peerLeft,
    submit,
    retry: retryUnknown,
    bodyChanged,
  }
}
