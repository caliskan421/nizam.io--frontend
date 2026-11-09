import { i18n } from '@/shared/i18n'
import { trOrganization } from '@/shared/i18n/tr/organization'

/** Bu ekranın alt ağacı (`organization.users.*`). */
export const trUsers = trOrganization.organization.users

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

/** 05 anahtarları (`organization.` öneki olmadan: `users.*`). */
export type UsersTextKey = Leaves<typeof trUsers, 'users.'>

/** `organization.users.*` metni (TR; statik ağaç `shared/i18n/tr/organization.ts`). */
export function usersText(key: UsersTextKey, params: Record<string, string | number> = {}): string {
  return i18n.global.t(`organization.${key}`, params)
}
