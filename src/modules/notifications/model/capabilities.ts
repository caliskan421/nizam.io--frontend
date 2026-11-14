/**
 * Bildirim görünürlüğü (14 `backend.md` §3.1): bütün uçlar kimlikli ve yalnız çağıranın
 * kayıtlarıdır; panel ve zil ÜÇ ROLDE AYNIDIR, mercek etkisizdir (mercek ≠ yetki, P1). Alıcıyı
 * sunucu çözer (K01–K07); istemci süzmez. Hedef ekranların görünürlüğü kendi gruplarındadır.
 */
export interface NotificationCapabilities {
  panel: boolean
  markRead: boolean
  markAllRead: boolean
  pushOptIn: boolean
}

/** Girdi YOK: rol/mercek karar vermez (üç rolde aynı). */
export function notificationCapabilities(): NotificationCapabilities {
  return { panel: true, markRead: true, markAllRead: true, pushOptIn: true }
}
