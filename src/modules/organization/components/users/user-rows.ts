/**
 * 05 tablo ve panel satır modeli (saf fonksiyonlar; E-05-06, E-05-13…20, E-05-27).
 *
 *  - Satır = hesap + SEÇİLİ PROGRAMIN ekip etiketleri (P13, #14): başka programın satırları
 *    gösterilmez; ayrıştırılamayan etiket yok sayılır (`model/memberships.ts`).
 *  - Koordinatörlük süzgecinde (E-05-08) kaynak tek birimin ekibidir (`listMembers`); kişinin
 *    öteki birimleri yalnız önbellekteki `listUsers` kaydından bilinir (ek istek yok).
 *  - Rol sekmeleri ve sayaçları yüklenen kümede istemcide; "Admin" okunamaz (BE-042).
 *  - Rol DİZESİ burada karşılaştırılmaz (K1): sunucu rolü `teamRoleOf` ile çevrilir.
 */
import type { TeamRole } from '@/shared/scope/standing-facts'

import {
  matchesRoleTab,
  teamRoleOf,
  USER_ROLE_TABS,
  type UserRoleTab,
} from '../../model/capabilities'
import { orderedRoles, programMemberships } from '../../model/memberships'
import type {
  KnownUser,
  MembershipLabel,
  ProgramDepartment,
  RosterMember,
  SortOrder,
} from '../../model/types'
import type { UsersTextKey } from './messages'

export interface UserRow {
  accountId: string
  fullName: string
  /** Seçili programdaki ekip satırları (çip = birim + rol). */
  labels: MembershipLabel[]
}

export const ROLE_TEXT: Readonly<Record<TeamRole, UsersTextKey>> = {
  coordinator: 'organization.users.roles.coordinator',
  member: 'organization.users.roles.member',
}

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

export function rowFromUser(user: KnownUser, programId: string | null): UserRow {
  return {
    accountId: user.account_id,
    fullName: user.full_name,
    labels: programMemberships(user, programId),
  }
}

/**
 * Ekip satırından satır: önbellekte hesap varsa onun bütün etiketleri, yoksa yalnız bu birimin
 * satırı. Önbellek bu birimi henüz bilmiyorsa (yarış) ekip satırı eklenir.
 */
export function rowFromRoster(
  member: RosterMember,
  programId: string,
  departmentId: string,
  known?: KnownUser,
): UserRow {
  const labels = known ? programMemberships(known, programId) : []
  const role = teamRoleOf(member.role)
  if (role && !labels.some((l) => l.departmentId === departmentId)) {
    labels.push({ programId, departmentId, role })
  }
  return { accountId: member.account_id, fullName: member.full_name, labels }
}

export function rowRoles(row: UserRow): Set<TeamRole> {
  return new Set(row.labels.map((l) => l.role))
}

/** Rozetler: ilk rol + kalanlar (sıra Koordinatör → Üye; Admin çizilmez — E-05-18/19). */
export function roleBadges(row: UserRow): { first: TeamRole | null; rest: TeamRole[] } {
  const [first = null, ...rest] = orderedRoles(rowRoles(row))
  return { first, rest }
}

export function filterByTab(rows: readonly UserRow[], tab: UserRoleTab): UserRow[] {
  return rows.filter((row) => matchesRoleTab(tab, rowRoles(row)))
}

/** Sekme sayaçları (yüklenen küme; "Admin" sayılamaz — BE-042, hep 0). */
export function tabCounts(rows: readonly UserRow[]): Record<UserRoleTab, number> {
  const counts = {} as Record<UserRoleTab, number>
  for (const tab of USER_ROLE_TABS) counts[tab] = filterByTab(rows, tab).length
  return counts
}

/** Türkçe büyük/küçük ve I/ı katlaması (sunucu `search` ile aynı anlam: yalnız ad). */
function fold(text: string): string {
  return text.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').trim()
}

export function searchRows(rows: readonly UserRow[], search: string): UserRow[] {
  const needle = fold(search)
  return needle === '' ? [...rows] : rows.filter((row) => fold(row.fullName).includes(needle))
}

export function sortRows(rows: readonly UserRow[], order: SortOrder): UserRow[] {
  const sign = order === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => sign * collator.compare(a.fullName, b.fullName))
}

/** Koordinatörlük adları (programdaki ad, G13); çözülemeyen kimlik gösterilmez (E-05-20). */
export function departmentNames(
  row: UserRow,
  byId: ReadonlyMap<string, ProgramDepartment>,
): string[] {
  const names: string[] = []
  for (const label of row.labels) {
    const name = byId.get(label.departmentId)?.display_name
    if (name && !names.includes(name)) names.push(name)
  }
  return names
}

/** Panel alt satırı (E-05-27): "‹ilk birim› · ‹rol›", çok birimde "‹ilk› +n". */
export function panelSubline(
  row: UserRow,
  byId: ReadonlyMap<string, ProgramDepartment>,
): { first: string; more: number; role: TeamRole } | null {
  const resolved = row.labels.filter((l) => byId.has(l.departmentId))
  const head = resolved[0]
  if (!head) return null
  return {
    first: byId.get(head.departmentId)?.display_name ?? '',
    more: resolved.length - 1,
    role: head.role,
  }
}
