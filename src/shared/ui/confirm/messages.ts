import { i18n } from '@/shared/i18n'
import { trConfirm } from '@/shared/i18n/tr/ui'

/**
 * Onay ve yazma sonucu bildirim metinleri (`confirm.*`; statik i18n ağacında,
 * `src/shared/i18n/tr/ui.ts`). Protokol metinleri (`mutation.*`) oradan okunur.
 */
export { trConfirm }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type ConfirmTextKey = Leaves<typeof trConfirm>

/** `confirm.*` metni (TR). */
export function confirmText(
  key: ConfirmTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(key, params)
}

/** Yazma protokolü metni (`mutation.*`; anahtar `outcomeMessage()`'tan ya da eylem adı). */
export function mutationText(key: string, params: Record<string, number> = {}): string {
  return i18n.global.t(key, params)
}
