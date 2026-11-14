/**
 * Okunmamış ayırıcısı (10 `backend.md` §4, README E-10-25; BE-082). Kendi okundu imleci hiçbir
 * cevapta yoktur: kural YAKLAŞIKTIR — sohbete girişteki `unread_count = n` ise akışın sonundan
 * geriye başkasının SON n mesajı sayılır, ilkinin üstüne ayırıcı konur. Silinmiş mesaj sayıma
 * girmez (pencerede zaten yok) ve katılım öncesi mesajlar sayılmaz (§10.4): `unread_count` ile
 * akıştaki "başkasının silinmemiş mesajı" kümesi aynıdır. n pencereyi aşıyorsa (daha eski
 * sayfalar gerekir) `needsOlder` döner; çağıran en çok `MAX_DIVIDER_OLDER_PAGES` `before`
 * sayfası yükler, bulunamazsa ayırıcı çizilmez.
 */
import type { ChatMessage } from './types'

export const MAX_DIVIDER_OLDER_PAGES = 3

export type DividerResult =
  | { kind: 'none' }
  | { kind: 'at'; messageId: string; seq: number; count: number }
  | { kind: 'needsOlder'; missing: number }

export function unreadDivider(
  items: readonly ChatMessage[],
  meAccountId: string,
  unreadCount: number,
): DividerResult {
  if (unreadCount <= 0) return { kind: 'none' }
  let remaining = unreadCount
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const message = items[i]!
    if (message.sender_account_id === meAccountId) continue
    remaining -= 1
    if (remaining === 0) {
      return { kind: 'at', messageId: message.message_id, seq: message.seq, count: unreadCount }
    }
  }
  return { kind: 'needsOlder', missing: remaining }
}

/** Okundu imlecini ilerletilecek mesaj: pencerenin en yeni (silinmemiş) mesajı. */
export function readCursorMessage(items: readonly ChatMessage[]): ChatMessage | null {
  return items.at(-1) ?? null
}
