import { i18n } from '@/shared/i18n'
import { trConflict } from '@/shared/i18n/tr/ui'

/**
 * Alan alan çakışma seçimi metinleri (`conflict.*`; statik i18n ağacında,
 * `src/shared/i18n/tr/ui.ts`). Alan adları ekranın kendi etiketleridir (çağıran çevirir).
 */
export { trConflict }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type ConflictTextKey = Leaves<typeof trConflict>

/** `conflict.*` metni (TR). */
export function conflictText(key: ConflictTextKey, params: Record<string, string> = {}): string {
  return i18n.global.t(key, params)
}
