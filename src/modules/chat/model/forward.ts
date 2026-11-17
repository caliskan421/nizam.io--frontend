/**
 * Mesajı ilet (BE-080, E-10-42/81…85) saf kuralları: hedef sayısı 1–10 benzersiz, not ≤5.000
 * karakter (sunucu aynı sınırı alan hatasıyla da doğrular). Anket iletilemez (sunucu 422
 * `message_id`; menüde gizlidir); silinmiş mesaj pencerede yoktur.
 */
import type { ChatMessage, ForwardChatMessageRequest, ForwardChatMessageResult } from './types'

export const FORWARD_TARGETS_MAX = 10
export const FORWARD_NOTE_MAX = 5000

export type ForwardError = 'targetsRequired' | 'targetsMax' | 'noteTooLong'

/** Menüde "İlet" görünür mü: yalnız anket olmayan mesaj (kaynak okunabilirliği sunucuda). */
export const canForward = (message: Pick<ChatMessage, 'poll'>): boolean => message.poll === null

export function validateForward(targets: readonly string[], note: string): ForwardError | null {
  const unique = new Set(targets).size
  if (unique === 0) return 'targetsRequired'
  if (unique > FORWARD_TARGETS_MAX) return 'targetsMax'
  if (note.trim().length > FORWARD_NOTE_MAX) return 'noteTooLong'
  return null
}

/** Gövde: benzersiz hedefler (seçim sırası), boş not gönderilmez. */
export function toForwardBody(targets: readonly string[], note: string): ForwardChatMessageRequest {
  const text = note.trim()
  return { targets: [...new Set(targets)], ...(text === '' ? {} : { note: text }) }
}

/** İletilen hedeflerden biri şu an açık sohbet mi (açık pencere gerçek `after` okumasıyla uzlaşır). */
export function includesOpenChat(
  result: ForwardChatMessageResult,
  openChatId: string | null,
): boolean {
  return openChatId !== null && result.items.some((item) => item.chat_id === openChatId)
}
