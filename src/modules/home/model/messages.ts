import { i18n } from '@/shared/i18n'
import { trHome } from '@/shared/i18n/tr/home'

export { trHome }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type HomeTextKey = Leaves<typeof trHome>

/** `home.*` metni (TR). */
export function homeText(key: HomeTextKey, params: Record<string, string | number> = {}): string {
  return i18n.global.t(key, params)
}
