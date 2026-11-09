import { i18n } from '@/shared/i18n'
import type { trOrganization } from '@/shared/i18n/tr/organization'

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

/** 08b anahtarları (`organization.` öneki olmadan: `coordinatorship.*`). */
export type DetailTextKey = Extract<
  Leaves<(typeof trOrganization)['organization']>,
  `coordinatorship.${string}`
>

/** `organization.coordinatorship.*` metni (TR; statik ağaç `shared/i18n/tr/organization.ts`). */
export function detailText(
  key: DetailTextKey,
  params: Readonly<Record<string, string | number>> = {},
): string {
  return i18n.global.t(`organization.${key}`, { ...params })
}
