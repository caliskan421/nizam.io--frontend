/**
 * Okundu imleci (BE-082): ayırıcı konumu sunucunun `first_unread_seq` değeridir (`thread/
 * use-unread-anchor.ts`); istemci `unread_count`'tan ayırıcı türetmez.
 */
import type { ChatMessage } from './types'

/** Okundu imlecini ilerletilecek mesaj: pencerenin en yeni (silinmemiş) mesajı. */
export function readCursorMessage(items: readonly ChatMessage[]): ChatMessage | null {
  return items.at(-1) ?? null
}
