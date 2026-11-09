import { i18n } from '@/shared/i18n'
import { trTopbar } from '@/shared/i18n/tr/shell'

export { trTopbar }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type TopbarTextKey = Leaves<typeof trTopbar>

/** `topbar.*` metni (TR). */
export function topbarText(
  key: TopbarTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(key, params)
}
