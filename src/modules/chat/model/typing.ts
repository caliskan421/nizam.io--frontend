/**
 * "Yazıyor" (istemci-akislari §10.10): gönderim en çok 1/3 sn (ucuz sinyal bütçesi); alış
 * olayı ÖNBELLEĞE YAZILMAZ — kısa ömürlü bellek durumu, ~5 sn sonra silinir. Adı çözümü üye
 * listesindendir (`listChatMembers`); olay yalnız `actor_account_id` taşır.
 */
export const TYPING_SEND_INTERVAL_MS = 3_000
export const TYPING_TTL_MS = 5_000

/** Gönderim kısıtlayıcı: aralık dolmadan `true` dönmez. `now` testte sahte saat. */
export function createTypingThrottle(
  intervalMs: number = TYPING_SEND_INTERVAL_MS,
  now: () => number = Date.now,
) {
  let last = Number.NEGATIVE_INFINITY
  return {
    /** Şimdi gönderilebilir mi; gönderilebilirse zamanı kaydeder. */
    take(): boolean {
      const t = now()
      if (t - last < intervalMs) return false
      last = t
      return true
    },
    reset() {
      last = Number.NEGATIVE_INFINITY
    },
  }
}

/** Sohbet başına yazanlar (hesap kimliği → bitiş zamanı). */
export function createTypingTracker(ttlMs: number = TYPING_TTL_MS, now: () => number = Date.now) {
  const byChat = new Map<string, Map<string, number>>()
  function live(chatId: string): string[] {
    const entries = byChat.get(chatId)
    if (!entries) return []
    const t = now()
    for (const [id, until] of entries) if (until <= t) entries.delete(id)
    if (entries.size === 0) byChat.delete(chatId)
    return [...entries.keys()]
  }
  return {
    touch(chatId: string, accountId: string) {
      const entries = byChat.get(chatId) ?? new Map<string, number>()
      entries.set(accountId, now() + ttlMs)
      byChat.set(chatId, entries)
    },
    /** Süresi dolmamış yazanlar (kendim hariç tutma çağıranın işi). */
    typing: live,
    clear() {
      byChat.clear()
    },
  }
}
