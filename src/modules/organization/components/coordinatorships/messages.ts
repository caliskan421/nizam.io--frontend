import { i18n } from '@/shared/i18n'
import { trOrganization } from '@/shared/i18n/tr/organization'

export { trOrganization }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

/** 08 liste anahtarları (`organization.` öneki olmadan: `coordinatorships.*`). */
export type CoordsTextKey = Extract<
  Leaves<(typeof trOrganization)['organization']>,
  `coordinatorships.${string}`
>

/** `organization.coordinatorships.*` metni (TR; statik ağaç `shared/i18n/tr/organization.ts`). */
export function coordsText(
  key: CoordsTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(`organization.${key}`, params)
}
