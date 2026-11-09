/**
 * 05b metin erişimi (`organization.tracking.*`, `src/shared/i18n/tr/organization.ts`). Ağaç statik TR
 * kaynağıdır; burada yalnız yaprak okunur ve `{ad}` yer tutucuları doldurulur (sunucu metni yok).
 * Anahtar tipi ağaçtan türetilir: olmayan anahtar derlenmez.
 */
import { trOrganization } from '@/shared/i18n/tr/organization'

export { trOrganization }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type TrackingTextKey = Leaves<typeof trOrganization>

type Node = string | { readonly [key: string]: Node }

function leaf(key: string): string {
  let node: Node = trOrganization
  for (const part of key.split('.')) {
    if (typeof node === 'string') return key
    node = node[part] ?? key
  }
  return typeof node === 'string' ? node : key
}

/** `organization.tracking.*` metni; `{ad}` yer tutucuları `params`'tan (eksik parametre olduğu gibi kalır). */
export function trackingText(
  key: TrackingTextKey,
  params: Readonly<Record<string, string | number>> = {},
): string {
  return leaf(key).replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}
