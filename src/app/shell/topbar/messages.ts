import { i18n } from '@/shared/i18n'

/**
 * Üst çubuk metinleri (`topbar.*`; 00-ortak `ozellikler.md` §4 "Üst çubuk" sözlüğü). Sunucu
 * metni kullanılmaz. Anahtarlar ilk kullanımda vue-i18n ağacına eklenir.
 */
export const trTopbar = {
  topbar: {
    history: 'Gezinme geçmişi',
    back: 'Geri',
    forward: 'İleri',
    crumbs: 'Konum',
    theme: 'Temayı değiştir',
    bell: 'Bildirimler',
    bellUnread: 'Bildirimler, {n} okunmamış',
    // ortak-kurallar §5: zil paneli F7'ye kadar devre dışı (sayaç canlı).
    bellPanelLater: 'Bildirim paneli F7’de açılacak',
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trTopbar)
  merged = true
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type TopbarTextKey = Leaves<typeof trTopbar>

/** `topbar.*` metni (TR). */
export function topbarText(
  key: TopbarTextKey,
  params: Record<string, string | number> = {},
): string {
  ensureMerged()
  return i18n.global.t(key, params)
}
