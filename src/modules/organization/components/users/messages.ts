import { trOrganization } from '@/shared/i18n/tr/organization'

/** Bu ekranın alt ağacı (`organization.users.*`). */
export const trUsers = trOrganization.organization.users

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type UsersTextKey = Leaves<typeof trUsers, 'organization.users.'>

type Node = string | { readonly [key: string]: Node }

/**
 * `organization.users.*` metni (TR). Kaynak statik ağaç `shared/i18n/tr/organization.ts`
 * (çalışma anında ileti eklenmez). Ağacın uygulama i18n kaydı (`shared/i18n/index.ts`) bu işçinin
 * sahipliği dışında olduğundan metin doğrudan aynı statik ağaçtan okunur ve `{ad}` yer
 * tutucuları burada doldurulur (çoğul/biçim yok).
 */
export function usersText(key: UsersTextKey, params: Record<string, string | number> = {}): string {
  let node: Node = trOrganization
  for (const part of key.split('.')) {
    node = typeof node === 'string' ? node : (node[part] ?? '')
  }
  const text = typeof node === 'string' ? node : ''
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}
