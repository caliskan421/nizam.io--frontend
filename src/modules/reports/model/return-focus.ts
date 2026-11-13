/**
 * Önizlemeden dönüşte odak (KESİN 27, E-13-17): "Kapat" bağlantısı tıklanınca hedef ekranın
 * "Önizle" bağlantısı odağı alır. Ekranlar farklı sayfalar olduğundan istek bellekte tek
 * anahtarlı bir bayrakla taşınır (URL/depolama yok); hedef bağlantı bağlanınca bir kez tüketilir.
 */
let pending: string | null = null

export function requestFocusReturn(key: string): void {
  pending = key
}

/** Bayrak bu anahtarsa tüketir ve `true` döner. */
export function takeFocusReturn(key: string): boolean {
  if (pending !== key) return false
  pending = null
  return true
}

export const SEASON_RETURN_KEY = 'season-preview'
export const meetingReturnKey = (meetingId: string): string => `meeting-preview:${meetingId}`
