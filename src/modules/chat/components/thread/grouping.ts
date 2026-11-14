/**
 * Akış satırları (10 mekanizma §5): gün ayırıcıları, okunmamış ayırıcı ve ardışık gruplama
 * istemcide hesaplanır. Gruplama kuralı (E-10-26): aynı gönderen ve ≤ 5 dk aralık; gün ya da
 * okunmamış ayırıcısı grubu böler. Sunucu `seq` sıralama kaynağıdır; `created_at` yalnız etiket
 * ve gün/aralık içindir.
 */
import type { ChatMessage } from '../../model/types'
import { dayKey } from './format'

export const GROUP_GAP_MS = 5 * 60_000

export interface DayEntry {
  type: 'day'
  key: string
  iso: string
}
export interface UnreadEntry {
  type: 'unread'
  key: string
  count: number
}
export interface MessageEntry {
  type: 'message'
  key: string
  message: ChatMessage
  mine: boolean
  /** Ardışık grubun ilki: gönderen adı burada görünür. */
  first: boolean
  /** Ardışık grubun sonu: avatar burada görünür. */
  last: boolean
}
export type ThreadEntry = DayEntry | UnreadEntry | MessageEntry

export interface EntryOptions {
  meId: string | null
  /** İlk okunmamış mesajın `seq` değeri (ayırıcı onun üstüne); yoksa `null`. */
  unreadAnchor: number | null
  unreadCount: number
}

function continues(prev: ChatMessage, next: ChatMessage): boolean {
  if (prev.sender_account_id !== next.sender_account_id) return false
  if (dayKey(prev.created_at) !== dayKey(next.created_at)) return false
  return Date.parse(next.created_at) - Date.parse(prev.created_at) <= GROUP_GAP_MS
}

export function buildEntries(items: readonly ChatMessage[], opts: EntryOptions): ThreadEntry[] {
  const out: ThreadEntry[] = []
  let prev: ChatMessage | null = null
  let lastMessage: MessageEntry | null = null
  for (const message of items) {
    const newDay = prev === null || dayKey(prev.created_at) !== dayKey(message.created_at)
    if (newDay)
      out.push({ type: 'day', key: `day-${dayKey(message.created_at)}`, iso: message.created_at })
    const divider = opts.unreadAnchor === message.seq && opts.unreadCount > 0
    if (divider) out.push({ type: 'unread', key: 'unread', count: opts.unreadCount })
    const joins = prev !== null && !newDay && !divider && continues(prev, message)
    if (lastMessage && !joins) lastMessage.last = true
    const entry: MessageEntry = {
      type: 'message',
      key: message.message_id,
      message,
      mine: opts.meId !== null && message.sender_account_id === opts.meId,
      first: !joins,
      last: false,
    }
    out.push(entry)
    lastMessage = entry
    prev = message
  }
  if (lastMessage) lastMessage.last = true
  return out
}

/**
 * Okunmamış ayırıcının çapası (E-10-25): akışın sonundan geriye BAŞKASININ son `count`
 * mesajı sayılır; ilkinin `seq`'i çapadır. Yüklü pencere yetmezse `null` (çağıran en çok 3 ek
 * `before` sayfası okur, yine bulunamazsa ayırıcı çizilmez).
 */
export function unreadAnchorSeq(
  items: readonly ChatMessage[],
  count: number,
  meId: string | null,
): number | null {
  if (count <= 0) return null
  let seen = 0
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const message = items[i]!
    if (message.sender_account_id === meId) continue
    seen += 1
    if (seen === count) return message.seq
  }
  return null
}
