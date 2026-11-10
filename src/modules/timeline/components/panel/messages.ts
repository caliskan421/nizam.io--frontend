/**
 * W94 panel metinleri (`timeline.panel.*`, `trTimeline` tek ağacının alt dalı). Sunucu `message`
 * alanı gösterilmez; hata metni kod → `errors.*` (`errorText`).
 */
import { i18n } from '@/shared/i18n'
import { trTimeline } from '@/shared/i18n/tr/timeline'

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type PanelTextKey = Leaves<typeof trTimeline.timeline.panel>

/** `timeline.panel.*` metni (TR). */
export function panelText(key: PanelTextKey, params?: Record<string, string | number>): string {
  const full = `timeline.panel.${key}`
  return params ? i18n.global.t(full, params) : i18n.global.t(full)
}

/** Durum adı (E-03C-60; `iade_edildi` = "Geri gönderildi", P5); bilinmeyen değer `null`. */
export function statusText(status: string): string | null {
  const known = trTimeline.timeline.panel.statuses
  return Object.hasOwn(known, status) ? panelText(`statuses.${status as keyof typeof known}`) : null
}
