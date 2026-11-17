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
  /** Güvenilir sayı yoksa `null` (genel "Okunmamış mesajlar" ayırıcısı). */
  count: number | null
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
  /** `null` = sunucu sayısı bilinmiyor (liste özeti yok): ayırıcı sayısız çizilir. */
  unreadCount: number | null
}

function continues(prev: ChatMessage, next: ChatMessage): boolean {
  if (prev.sender_account_id !== next.sender_account_id) return false
  if (dayKey(prev.created_at) !== dayKey(next.created_at)) return false
  return Date.parse(next.created_at) - Date.parse(prev.created_at) <= GROUP_GAP_MS
}

/** Mesajdan ÖNCE gelen ayırıcılar (gün, okunmamış); hangileri çıktığı bilgisini döndürür. */
function pushSeparators(
  out: ThreadEntry[],
  prev: ChatMessage | null,
  message: ChatMessage,
  opts: EntryOptions,
): boolean {
  const newDay = prev === null || dayKey(prev.created_at) !== dayKey(message.created_at)
  if (newDay) {
    out.push({ type: 'day', key: `day-${dayKey(message.created_at)}`, iso: message.created_at })
  }
  const divider =
    opts.unreadAnchor === message.seq && (opts.unreadCount === null || opts.unreadCount > 0)
  if (divider) out.push({ type: 'unread', key: 'unread', count: opts.unreadCount })
  return newDay || divider
}

export function buildEntries(items: readonly ChatMessage[], opts: EntryOptions): ThreadEntry[] {
  const out: ThreadEntry[] = []
  let prev: ChatMessage | null = null
  let lastMessage: MessageEntry | null = null
  for (const message of items) {
    const separated = pushSeparators(out, prev, message, opts)
    const joins = prev !== null && !separated && continues(prev, message)
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
