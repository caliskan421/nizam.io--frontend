import { trCoordinatorships } from '@/shared/i18n/tr/organization'

export { trCoordinatorships }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type CoordsTextKey = Leaves<typeof trCoordinatorships>

type Node = { readonly [key: string]: string | Node }

/**
 * `coordinatorships.*` metni (TR). Kaynak statik ağaç `shared/i18n/tr/organization.ts`; ağaç
 * uygulama i18n birleşimine (`shared/i18n/index.ts`) henüz kayıtlı olmadığından yaprak doğrudan
 * okunur ve `{ad}` yer tutucuları doldurulur (vue-i18n biçimiyle aynı; çalışma anı ileti ekleme
 * yok). Kayıt yapılınca bu fonksiyon `i18n.global.t`'ye dönebilir — çağıranlar değişmez.
 */
export function coordsText(
  key: CoordsTextKey,
  params: Readonly<Record<string, string | number>> = {},
): string {
  let node: string | Node = trCoordinatorships
  for (const part of key.split('.')) {
    if (typeof node === 'string') break
    node = node[part] ?? ''
  }
  const text = typeof node === 'string' ? node : ''
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] === undefined ? match : String(params[name]),
  )
}
