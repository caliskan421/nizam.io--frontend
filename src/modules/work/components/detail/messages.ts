import { i18n } from '@/shared/i18n'
import { trWorkDetail } from '@/shared/i18n/tr/work'

export { trWorkDetail }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type WorkDetailTextKey = Leaves<typeof trWorkDetail>

/** `workDetail.*` metni (TR). */
export function detailText(
  key: WorkDetailTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(key, params)
}
