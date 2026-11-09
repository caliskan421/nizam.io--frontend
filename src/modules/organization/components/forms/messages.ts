/**
 * W74 form bileşenlerinin ekran metinleri (`organization.forms.*`; tek statik ağaç
 * `shared/i18n/tr/organization.ts`, `shared/i18n/index.ts`'e kayıtlı). Sunucu `message` alanı
 * gösterilmez; hata metni kod → `errors.*` (`shared/i18n` `errorText`).
 */
import { i18n } from '@/shared/i18n'
import { trOrganization } from '@/shared/i18n/tr/organization'
import type { TeamRole } from '@/shared/scope/standing-facts'

import type { DepartmentKind } from '../../model/types'

export { trOrganization }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

/** Form anahtarları (`organization.` öneki olmadan: `forms.*`). */
export type OrgFormsTextKey = Extract<
  Leaves<(typeof trOrganization)['organization']>,
  `forms.${string}`
>

/** `organization.forms.*` metni (TR). */
export function orgText(
  key: OrgFormsTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(`organization.${key}`, params)
}

export function kindLabel(kind: DepartmentKind): string {
  return orgText(`forms.kind.${kind}`)
}

export function roleLabel(role: TeamRole): string {
  return orgText(`forms.role.${role}`)
}
