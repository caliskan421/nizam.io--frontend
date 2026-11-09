/**
 * 05b metin erişimi (`organization.tracking.*`; statik TR ağacı `shared/i18n/tr/organization.ts`,
 * `i18n/index.ts`'e kayıtlı). Anahtar `organization.` öneki olmadan verilir (`tracking.*`); tipi
 * ağaçtan türetilir: olmayan anahtar derlenmez. Sunucu metni kullanılmaz.
 */
import { i18n } from '@/shared/i18n'
import { trOrganization } from '@/shared/i18n/tr/organization'

export { trOrganization }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

/** 05b anahtarları (`organization.` öneki olmadan: `tracking.*`). */
export type TrackingTextKey = Extract<
  Leaves<(typeof trOrganization)['organization']>,
  `tracking.${string}`
>

/** `organization.tracking.*` metni (TR). */
export function trackingText(
  key: TrackingTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(`organization.${key}`, params)
}
