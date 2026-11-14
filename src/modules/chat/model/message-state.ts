/**
 * Gönderim durumu ve istemci mesaj kimliği (10 `mekanizma.md` §4.1, §9.1; istemci-akislari
 * §10.2). İyimser balon YOK: durum yalnız gönderim alanının durumudur. Kimlik taslakla birlikte
 * korunur; ağ tekrarı AYNI kimlik + AYNI gövdedir, gövde değişirse yeni kimlik (yeni eylem),
 * `messaging.message_deleted` sonrası yeni kimlik üretilmez.
 */
import type { MutationOutcome } from '@/shared/http/mutation'

import type { ChatMessage, ReactionKind, SendChatMessageRequest } from './types'

/** 1–100 bayt yazdırılabilir ASCII, boşluksuz (UUID bu kurala uyar). */
export function newClientMessageId(): string {
  return `cm-${crypto.randomUUID()}`
}

const CLIENT_ID = /^[\x21-\x7e]{1,100}$/
export function isValidClientMessageId(id: string): boolean {
  return CLIENT_ID.test(id)
}

export type SendState = 'sending' | 'failed' | 'sent'

export type SendVerdict =
  /** 201/200: mesaj sunucuda; pencereye işlenir, taslak temizlenir. */
  | { state: 'sent'; message: ChatMessage }
  /** Sonuç bilinmiyor: AYNI kimlikle tek tekrar sunulur (`canRetry`). */
  | { state: 'failed'; reason: 'unknown'; canRetry: boolean }
  /** 409 message_deleted: yeni kimlik üretilmez, taslak kullanıcıda kalır. */
  | { state: 'failed'; reason: 'deleted'; canRetry: false }
  /** 403 not_authorized + `@herkes` var: yalnız bahsetme reddedildi, yazma alanı AÇIK. */
  | { state: 'failed'; reason: 'mention_rejected'; canRetry: false }
  /** 403 not_authorized (birebir): karşı taraf programdan çıktı; yazma alanı KAPANIR. */
  | { state: 'failed'; reason: 'peer_left'; canRetry: false }
  /** 404 message_not_found: yanıtlanan mesaj silinmiş; yanıt bağlamı kaldırılır. */
  | { state: 'failed'; reason: 'reply_gone'; canRetry: false }
  | { state: 'failed'; reason: 'rate_limited'; canRetry: false; retryAfter: number | null }
  | { state: 'failed'; reason: 'other'; canRetry: false }

/** İstek gövdesinde `{kind:'all'}` bahsetmesi var mı (CX-S-09 ayrımının tek girdisi). */
export function mentionsAll(body: Pick<SendChatMessageRequest, 'mentions'>): boolean {
  return body.mentions?.some((m) => m.kind === 'all') === true
}

export interface SendContext {
  chatKind: 'direct' | 'group'
  /** Gönderilen gövde: 403 ayrımı için (`@herkes` var mı). */
  body: Pick<SendChatMessageRequest, 'mentions'>
}

/**
 * Gönderim sonucunu ekran kararına çevirir. 403 `messaging.not_authorized` iki ayrı durumu aynı
 * kodla taşır (CX-S-09): gövdede `{kind:'all'}` varsa (b) yalnız bahsetme reddi; yoksa ve sohbet
 * birebirse (a) karşı taraf ayrıldı. Grupta ve `@herkes`siz 403 genel "yetki yok"tur (`other`).
 */
export function classifySend<V>(
  outcome: MutationOutcome<V, ChatMessage>,
  context: SendContext,
): SendVerdict {
  switch (outcome.kind) {
    case 'success':
      return { state: 'sent', message: outcome.data }
    case 'unknown_outcome':
      return { state: 'failed', reason: 'unknown', canRetry: outcome.retry !== null }
    case 'rate_limited':
      return {
        state: 'failed',
        reason: 'rate_limited',
        canRetry: false,
        retryAfter: outcome.retryAfter,
      }
    case 'failed':
      return classifyCode(outcome.error.code, context)
    default:
      return { state: 'failed', reason: 'other', canRetry: false }
  }
}

function classifyCode(code: string, context: SendContext): SendVerdict {
  if (code === 'messaging.message_deleted') {
    return { state: 'failed', reason: 'deleted', canRetry: false }
  }
  if (code === 'messaging.message_not_found') {
    return { state: 'failed', reason: 'reply_gone', canRetry: false }
  }
  if (code === 'messaging.not_authorized') {
    if (mentionsAll(context.body)) {
      return { state: 'failed', reason: 'mention_rejected', canRetry: false }
    }
    const reason = context.chatKind === 'direct' ? 'peer_left' : 'other'
    return { state: 'failed', reason, canRetry: false }
  }
  return { state: 'failed', reason: 'other', canRetry: false }
}

/** Tepki seçici dört tür (MESSAGING-K36); tasarımdaki 😂 🎉 🙏 sözleşmede yoktur (P61). */
export const REACTION_KINDS: readonly ReactionKind[] = ['like', 'heart', 'check', 'star']

/** Kişi başına tek tepki: aynı türe dokunuş kaldırır, farklı tür yerine geçer (`PUT`). */
export function reactionIntent(
  message: Pick<ChatMessage, 'reactions'>,
  tapped: ReactionKind,
): 'set' | 'delete' {
  const mine = message.reactions.find((r) => r.mine)
  return mine?.kind === tapped ? 'delete' : 'set'
}
