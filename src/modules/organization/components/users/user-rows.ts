/**
 * 05 tablo ve panel satır modeli (saf fonksiyonlar; E-05-06, E-05-13…20, E-05-27).
 *
 *  - Satır = hesap + SEÇİLİ PROGRAMIN ekip etiketleri (P13, #14): başka programın satırları
 *    gösterilmez; ayrıştırılamayan etiket yok sayılır (`model/memberships.ts`).
 *  - Hesap olguları sunucudan (v0.14): `email`, `company_admin`, `account_status`, `login_locked`
 *    (BE-041/042/044); tahmin yok.
 *  - Rol sekmeleri, arama, sıralama, koordinatörlük süzgeci ve sayaçlar SUNUCUDADIR (BE-011);
 *    burada istemci süzmesi/sayımı yoktur.
 *  - Rol DİZESİ burada karşılaştırılmaz (K1): sunucu rolü `teamRoleOf` ile çevrilir.
 */
import type { TeamRole } from '@/shared/scope/standing-facts'

import { isCompanyAdmin } from '../../model/capabilities'
import { orderedRoles, programMemberships } from '../../model/memberships'
import type { KnownUser, MembershipLabel, ProgramDepartment } from '../../model/types'
import type { UsersTextKey } from './messages'

export interface UserRow {
  accountId: string
  fullName: string
  email: string
  /** Şirket yöneticisi mi (ekip satırlarından bağımsız; BE-042). */
  companyAdmin: boolean
  accountStatus: KnownUser['account_status']
  /** Süren başarısız giriş kilidi (BE-044); hesabı kapatma (`accountStatus`) değildir. */
  loginLocked: boolean
  /** Seçili programdaki ekip satırları (çip = birim + rol). */
  labels: MembershipLabel[]
}

/** Rozet rolü: şirket yöneticisi ya da ekip rolü. */
export type RowRole = 'admin' | TeamRole

export const ROLE_TEXT: Readonly<Record<RowRole, UsersTextKey>> = {
  admin: 'users.roles.admin',
  coordinator: 'users.roles.coordinator',
  member: 'users.roles.member',
}

export function rowFromUser(user: KnownUser, programId: string | null): UserRow {
  return {
    accountId: user.account_id,
    fullName: user.full_name,
    email: user.email,
    companyAdmin: isCompanyAdmin(user),
    accountStatus: user.account_status,
    loginLocked: user.login_locked,
    labels: programMemberships(user, programId),
  }
}

export function rowRoles(row: UserRow): Set<TeamRole> {
  return new Set(row.labels.map((l) => l.role))
}

/** Rozetler: ilk rol + kalanlar (sıra Admin → Koordinatör → Üye; E-05-18/19). */
export function roleBadges(row: UserRow): { first: RowRole | null; rest: RowRole[] } {
  const roles: RowRole[] = [
    ...(row.companyAdmin ? (['admin'] as const) : []),
    ...orderedRoles(rowRoles(row)),
  ]
  const [first = null, ...rest] = roles
  return { first, rest }
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
