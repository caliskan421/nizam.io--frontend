/**
 * Konuşma listesi gösterim kuralları (10 README E-10-06, E-10-09…E-10-15; saf, bileşensiz).
 * Süzgeç sekmeleri `listChats`'e sunucu süzgeci gelene dek (BE-081) YALNIZ yüklenen sayfalara
 * uygulanan istemci süzgecidir; satır sırası sunucunundur (P64, E-10-13) — burada sıralama yok.
 */
import { chatText } from '../../messages'
import type { ChatSummary } from '../../model/types'

export const CHAT_FILTERS = ['all', 'unread', 'groups', 'people'] as const
export type ChatFilter = (typeof CHAT_FILTERS)[number]

/** `?filtre=` değerleri (rota katalog sorgusu; "Tümü" sorgusuzdur). */
export const FILTER_QUERY: Record<Exclude<ChatFilter, 'all'>, string> = {
  unread: 'okunmamis',
  groups: 'gruplar',
  people: 'kisiler',
}

/** Bilinmeyen/çoklu değer "Tümü"dür (sessiz); URL elle bozulsa da liste çalışır. */
export function parseFilter(raw: unknown): ChatFilter {
  const value = Array.isArray(raw) ? raw[0] : raw
  const hit = (Object.keys(FILTER_QUERY) as Exclude<ChatFilter, 'all'>[]).find(
    (key) => FILTER_QUERY[key] === value,
  )
  return hit ?? 'all'
}

export function applyFilter(items: readonly ChatSummary[], filter: ChatFilter): ChatSummary[] {
  switch (filter) {
    case 'unread':
      return items.filter((chat) => chat.unread_count > 0)
    case 'groups':
      return items.filter((chat) => chat.kind === 'group')
    case 'people':
      return items.filter((chat) => chat.kind === 'direct')
    default:
      return [...items]
  }
}

/** Grupta `name`, birebirde `counterpart_name`; ad yoksa nötr "Bilinmeyen kişi" (E-10-10). */
export function chatTitle(chat: Pick<ChatSummary, 'name' | 'counterpart_name'>): string {
  const name = chat.name ?? chat.counterpart_name
  return name !== null && name.trim() !== '' ? name : chatText('chat.list.unknownPerson')
}

export type AvatarKind = 'sys' | 'code' | 'grp' | 'person'
export interface ChatAvatar {
  kind: AvatarKind
  text: string
}

function initials(name: string, count: number): string {
  return name
    .trim()
    .split(/\s+/)
    .filter((word) => word !== '')
    .slice(0, count)
    .map((word) => word.charAt(0))
    .join('')
    .toLocaleUpperCase('tr-TR')
}

/**
 * E-10-09: `general` → "G"; koordinatörlük grubu (`auto_kind`/`source` = department) → katalog
 * kodunun 3 harfi (kod yoksa ad baş harfleri); serbest grup → 2 baş harf; birebir → karşı tarafın
 * baş harfleri. "Koordinatörler" sistem grubu ("K") çizilmez (BE-160).
 */
export function avatarOf(chat: ChatSummary, departmentCode?: string): ChatAvatar {
  const title = chatTitle(chat)
  if (chat.auto_kind === 'general') return { kind: 'sys', text: 'G' }
  if (chat.auto_kind === 'department' || chat.source === 'department') {
    const code = departmentCode?.trim()
    return {
      kind: 'code',
      text: code ? code.slice(0, 3).toLocaleUpperCase('tr-TR') : initials(title, 3),
    }
  }
  if (chat.kind === 'group') return { kind: 'grp', text: initials(title, 2) }
  return { kind: 'person', text: initials(title, 2) }
}

/** İğne simgesi yalnız kendiliğinden kurulan (sistem) gruplarda (E-10-13). */
export const isSystemGroup = (chat: Pick<ChatSummary, 'auto_kind'>): boolean =>
  chat.auto_kind !== null

/** Rozet sayısı: 99'dan büyükse "99+" (E-10-14). */
export const badgeCount = (n: number): string => (n > 99 ? '99+' : String(n))

export interface RowPreview {
  text: string
  /** Gönderen öneki ("Sen: " / "Ali: ") — metinden ayrı verilir. */
  prefix: string
}

/**
 * E-10-12: kendi mesajım "Sen: ", grupta başkasının ilk adı, birebirde öneksiz; silinmiş →
 * "silinmiş mesaj"; gövde boş (ek) → "Dosya" (tür bilgisi yok, BE-086); `last_message` yok → `null`.
 */
export function previewOf(chat: ChatSummary, meAccountId: string | null): RowPreview | null {
  const last = chat.last_message
  if (last === null) return null
  if (last.deleted) return { prefix: '', text: chatText('chat.list.deletedPreview') }
  const text = (last.body ?? '').trim() === '' ? chatText('chat.list.filePreview') : last.body!
  let prefix = ''
  if (meAccountId !== null && last.sender_account_id === meAccountId) {
    prefix = chatText('chat.list.you')
  } else if (chat.kind === 'group') {
    const first = last.sender_name.trim().split(/\s+/)[0] ?? ''
    prefix = first === '' ? '' : `${first}: `
  }
  return { prefix, text }
}

function dayKey(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at)
}

const dayNumber = (key: string): number => Date.parse(`${key}T00:00:00Z`) / 86_400_000

/** İki saat dilimi adı geçersizse kurulum varsayılanına düşer (liste çökmesin). */
function safeZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat('tr-TR', { timeZone })
    return timeZone
  } catch {
    return 'Europe/Istanbul'
  }
}

/**
 * E-10-11: bugün "SS:dd", dün "Dün", aynı yıl "G Aaa", farklı yıl "G Aaa YYYY"; kurulum saat
 * dilimiyle. `last_message_at` boşsa zaman çizilmez (`null`).
 */
export function chatTime(
  iso: string | null,
  now: Date,
  timeZone: string,
  yesterdayLabel: string,
): string | null {
  if (iso === null) return null
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return null
  const zone = safeZone(timeZone)
  const [thisDay, today] = [dayKey(at, zone), dayKey(now, zone)]
  const diff = dayNumber(today) - dayNumber(thisDay)
  if (diff === 0) {
    return new Intl.DateTimeFormat('tr-TR', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(at)
  }
  if (diff === 1) return yesterdayLabel
  const sameYear = thisDay.slice(0, 4) === today.slice(0, 4)
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: zone,
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' as const }),
  }).format(at)
}
