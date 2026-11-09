import { i18n } from '@/shared/i18n'
import { trStates } from '@/shared/i18n/tr/states'

export { trStates }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type StatesTextKey = Leaves<typeof trStates>

/** `states.*` metni (TR). */
export function statesText(
  key: StatesTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(key, params)
}
