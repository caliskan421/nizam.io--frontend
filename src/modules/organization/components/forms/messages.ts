/**
 * W74 form bileşenlerinin ekran metinleri (`orgForms.*`; kaynak `shared/i18n/tr/organization.ts`).
 * Sunucu `message` alanı gösterilmez; hata metni kod → `errors.*` (`shared/i18n` `errorText`).
 *
 * Ağaç uygulama i18n'ine kayıtlıysa (`shared/i18n/index.ts` — koordinatörün birleştirme işi)
 * vue-i18n'den okunur; değilse aynı statik ağaçtan doğrudan çözülür (çalışma anında ileti
 * birleştirme YOK — statik ağaç tek kaynak). İki yol aynı metni verir (test).
 */
import { i18n } from '@/shared/i18n'
import { trOrgForms } from '@/shared/i18n/tr/organization'

import type { DepartmentKind } from '../../model/types'
import type { TeamRole } from '@/shared/scope/standing-facts'

export { trOrgForms }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type OrgFormsTextKey = Leaves<typeof trOrgForms>

type Node = string | { readonly [key: string]: Node }

function lookup(key: string): string {
  let node: Node = trOrgForms
  for (const part of key.split('.')) {
    if (typeof node === 'string') return key
    const next: Node | undefined = node[part]
    if (next === undefined) return key
    node = next
  }
  return typeof node === 'string' ? node : key
}

function interpolate(text: string, params: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (all, name: string) =>
    name in params ? String(params[name]) : all,
  )
}

/** `orgForms.*` metni (TR). */
export function orgText(key: OrgFormsTextKey, params?: Record<string, string | number>): string {
  const g = i18n.global
  if (g.te(key)) return params ? g.t(key, params) : g.t(key)
  const text = lookup(key)
  return params ? interpolate(text, params) : text
}

export function kindLabel(kind: DepartmentKind): string {
  return orgText(`orgForms.kind.${kind}`)
}

export function roleLabel(role: TeamRole): string {
  return orgText(`orgForms.role.${role}`)
}
