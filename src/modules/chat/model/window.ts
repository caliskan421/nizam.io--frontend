/**
 * Mesaj penceresi (10 `backend.md` §5, istemci-akislari §10.3/§10.5): sohbetin `seq` sıralı,
 * yüklenmiş ARDIŞIK aralığı `[A, Ü]`. Saf işlevler: pencere birleştirme, kimlikle kaldırma,
 * "daha eski/yeni var" bayrakları ve yeniden bağlanma uzlaştırması (kapsanan aralıkta dönmeyen
 * yerel kayıt silinmiş sayılır). Sunucu `seq`'i sıralama kaynağıdır; zaman damgası kullanılmaz.
 */
import type { ChatMessage } from './types'

/** Sayfa boyu (varsayılan 50; tavan 200). */
export const MESSAGE_PAGE_LIMIT = 50

export interface MessageWindow {
  /** `seq` artan, tekil `message_id`. */
  items: ChatMessage[]
  /** Birebirde karşı tarafın okundu imleci; grupta `null` (tik yalnız birebirde). */
  peerReadSeq: number | null
  /** Pencerenin altında (daha eski) mesaj olabilir. */
  hasOlder: boolean
  /** Pencerenin üstünde (daha yeni) mesaj olabilir. */
  hasNewer: boolean
}

export function emptyWindow(): MessageWindow {
  return { items: [], peerReadSeq: null, hasOlder: false, hasNewer: false }
}

const bySeq = (a: ChatMessage, b: ChatMessage) => a.seq - b.seq

/** Aynı `message_id` birden çok `seq` taşımaz; son gelen kayıt (güncel) kazanır. */
function upsertAll(items: readonly ChatMessage[], incoming: readonly ChatMessage[]): ChatMessage[] {
  const byId = new Map(items.map((m) => [m.message_id, m]))
  // Yeni kayıt eskinin ÜSTÜNE yayılır: gönderim/düzenleme cevabı `sender_name` taşımaz (yalnız
  // geçmiş cevabı taşır); yerelde bilinen ad korunur, diğer her alan sunucudan gelir.
  for (const m of incoming) byId.set(m.message_id, { ...byId.get(m.message_id), ...m })
  return [...byId.values()].sort(bySeq)
}

export function lowSeq(win: MessageWindow): number | null {
  return win.items[0]?.seq ?? null
}

export function highSeq(win: MessageWindow): number | null {
  return win.items.at(-1)?.seq ?? null
}

/** Son sayfa (imleçsiz okuma): pencerenin üstü sohbetin sonudur. */
export function windowFromLatest(
  page: readonly ChatMessage[],
  peer: number | null,
  limit = MESSAGE_PAGE_LIMIT,
) {
  return {
    items: [...page].sort(bySeq),
    peerReadSeq: peer,
    hasOlder: page.length >= limit,
    hasNewer: false,
  } satisfies MessageWindow
}

/**
 * `around=<seq>` okuması: pencerenin iki yanı da açık olabilir (sohbetin başı/sonu bilinmez).
 * Sayfa boyundan azsa o yan kesin kapalı kabul edilmez; `loadNewer` boş dönerse kapanır.
 */
export function windowFromAround(
  page: readonly ChatMessage[],
  peer: number | null,
  anchor: number,
) {
  const items = [...page].sort(bySeq)
  const first = items[0]?.seq ?? anchor
  return {
    items,
    peerReadSeq: peer,
    hasOlder: first > 1,
    hasNewer: true,
  } satisfies MessageWindow
}

/** Daha eski sayfa (`before`): sayfa boyu dolmadıysa başlangıca ulaşıldı. */
export function prependOlder(
  win: MessageWindow,
  page: readonly ChatMessage[],
  limit = MESSAGE_PAGE_LIMIT,
) {
  return {
    ...win,
    items: upsertAll(win.items, page),
    hasOlder: page.length >= limit && !page.some((m) => m.seq <= 1),
  } satisfies MessageWindow
}

/** Daha yeni sayfa (`after`): sayfa boyu dolmadıysa sohbetin sonuna ulaşıldı. */
export function appendNewer(
  win: MessageWindow,
  page: readonly ChatMessage[],
  peer: number | null,
  limit = MESSAGE_PAGE_LIMIT,
) {
  return {
    ...win,
    items: upsertAll(win.items, page),
    peerReadSeq: peer ?? win.peerReadSeq,
    hasNewer: page.length >= limit,
  } satisfies MessageWindow
}

/** Tek mesajı ekler/günceller (gönderim/düzenleme/mesajdan görev cevabı; SSE yankısı tekilleşir). */
export function upsertMessage(win: MessageWindow, message: ChatMessage): MessageWindow {
  return { ...win, items: upsertAll(win.items, [message]) }
}

/** Mesajı kimlikle kaldırır (silme; `message.deleted` olayı okuma gerektirmez). */
export function removeMessage(win: MessageWindow, messageId: string): MessageWindow {
  if (!win.items.some((m) => m.message_id === messageId)) return win
  return { ...win, items: win.items.filter((m) => m.message_id !== messageId) }
}

/** Mesaj yerelde var mı; varsa yerel `seq` (`message.updated` için `around` imleci). */
export function seqOf(win: MessageWindow, messageId: string): number | null {
  return win.items.find((m) => m.message_id === messageId)?.seq ?? null
}

/** Yerelde kayıtlı mesajı (kimlikle) döndürür. */
export function findMessage(win: MessageWindow, messageId: string): ChatMessage | null {
  return win.items.find((m) => m.message_id === messageId) ?? null
}

/**
 * Yeniden bağlanma uzlaştırması, TEK `before` sayfası (istemci-akislari §10.5): `cursor` bu
 * sayfanın imleci (`before=<cursor>`); sayfa `[min, cursor-1]` aralığını kapsar. Sayfa `limit`'ten
 * AZ döndüyse aralığın altı açıktır (kapsam `[−∞, cursor-1]`): aralıkta olup dönmeyen yerel kayıt
 * silinmiş sayılır ve kaldırılır; **boş sonuç** imlecin altındaki bütün yerel mesajların
 * silindiğini söyler. Dönen kayıtlar yereli günceller.
 */
export function applyCoverage(
  win: MessageWindow,
  page: readonly ChatMessage[],
  cursor: number,
  limit = MESSAGE_PAGE_LIMIT,
): MessageWindow {
  const returned = new Set(page.map((m) => m.message_id))
  const floor =
    page.length >= limit ? Math.min(...page.map((m) => m.seq)) : Number.NEGATIVE_INFINITY
  const kept = win.items.filter(
    (m) => returned.has(m.message_id) || m.seq >= cursor || m.seq < floor,
  )
  return { ...win, items: upsertAll(kept, page) }
}

/**
 * Uzlaştırma bu sayfadan sonra bitti mi: sayfanın en küçük `seq`'i pencerenin alt sınırına (`A`)
 * eşit/altındaysa ya da sayfa `limit`'ten az döndüyse pencere tamamdır.
 */
export function coverageDone(
  page: readonly ChatMessage[],
  lowerBound: number,
  limit = MESSAGE_PAGE_LIMIT,
): boolean {
  if (page.length < limit) return true
  return Math.min(...page.map((m) => m.seq)) <= lowerBound
}

/** Sonraki uzlaştırma sayfasının imleci: sayfanın en küçük `seq`'i. */
export function nextCursor(page: readonly ChatMessage[]): number {
  return Math.min(...page.map((m) => m.seq))
}
