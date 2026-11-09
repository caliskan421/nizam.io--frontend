import { trOrganization } from '@/shared/i18n/tr/organization'

/**
 * 08b metinleri (`organization.coordinatorship.*`). Kaynak statik TR ağacı `shared/i18n/tr/organization.ts`
 * (tek kaynak; çalışma anında ağaca ekleme yok). Uygulama i18n kaydı (`shared/i18n/index.ts`)
 * W73'ün sahipliği dışında olduğundan metin doğrudan bu ağaçtan çözülür ve `{ad}` yer tutucuları
 * burada doldurulur (vue-i18n ile aynı biçim); kayıt eklendiğinde davranış değişmez.
 */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type DetailTextKey = Leaves<typeof trOrganization>

type Node = string | { readonly [key: string]: Node }

function lookup(key: string): string {
  let node: Node = trOrganization
  for (const part of key.split('.')) {
    if (typeof node === 'string') return key
    node = node[part] ?? key
  }
  return typeof node === 'string' ? node : key
}

/** `organization.coordinatorship.*` metni (TR); eksik parametre yer tutucusu olduğu gibi kalır. */
export function detailText(
  key: DetailTextKey,
  params: Readonly<Record<string, string | number>> = {},
): string {
  return lookup(key).replace(/\{(\w+)\}/g, (whole, name: string) =>
    params[name] === undefined ? whole : String(params[name]),
  )
}
