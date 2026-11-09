import { i18n } from '@/shared/i18n'
import { trUi } from '@/shared/i18n/tr/ui'

/**
 * `shared/ui` bileşenlerinin kendi metinleri (`ui.*`). Ekran metni bileşene prop olarak gelir;
 * burada yalnız bileşenin kendi denetimlerinin erişim adları ve nötr yer tutucular durur.
 * Metinler statik i18n ağacındadır (`src/shared/i18n/tr/ui.ts`).
 */
export { trUi }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type UiTextKey = Leaves<typeof trUi>

/** `ui.*` metni (TR). */
export function uiText(key: UiTextKey): string {
  return i18n.global.t(key)
}
