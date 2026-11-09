import { i18n } from '@/shared/i18n'
import { trSide } from '@/shared/i18n/tr/shell'

export { trSide }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type SideTextKey = Leaves<typeof trSide>

/** `side.*` metni (TR). */
export function sideText(key: SideTextKey, params: Record<string, string | number> = {}): string {
  return i18n.global.t(key, params)
}
