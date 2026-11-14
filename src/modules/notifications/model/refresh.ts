/**
 * Tazeleme kuralı (14 `mekanizma.md` §5; P65: bildirimlerde SSE YOK). Sayaç `staleTime` 30 sn +
 * pencere odağı (TanStack varsayılanı) + 60 sn aralık; aralık yalnız sekme görünürken çalışır
 * (`refetchIntervalInBackground` kapalı). Panel listesi yalnız panel AÇIKKEN okunur (kapalıyken
 * sorgu etkin değildir) ve 30 sn aralıkla + odakta tazelenir. Görev/toplantı yazmaları bildirim
 * listesini geçersizlemez: kaydı sunucu üretir.
 */
export const UNREAD_STALE_MS = 30_000
export const UNREAD_INTERVAL_MS = 60_000
export const LIST_STALE_MS = 30_000
export const LIST_INTERVAL_MS = 30_000
/** Panel sayfa boyu (`limit`); sorgu anahtarına girmez. */
export const LIST_PAGE_LIMIT = 30
/** VAPID açık anahtarı seyrek değişir (VAPID rotasyonu yok, GAP-043); odakta tazelenmez. */
export const PUSH_KEY_STALE_MS = 3_600_000
