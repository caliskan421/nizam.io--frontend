/**
 * `KnownUser.memberships[]` etiket ayrıştırıcı (G16; 05 `backend.md` §1 E-05-20, §4).
 *
 * Etiket tipsiz bir dizedir: `"<program_id>:<department_id>:<rol>"` (kimlikler, ad değil; kod
 * okuması `m.ProgramID+":"+m.DepartmentID+":"+role`). İstemci `:` ile ayırır; üç parçaya
 * ayrılmayan, boş parçalı ya da rolü bilinmeyen etiket YOK SAYILIR (E-05-06 kabul kanıtı).
 * Rol dizesi yalnız `capabilities.ts`'te çevrilir (`teamRoleOf`, K1 lint).
 *
 * Seçili program kuralı (P13, #14): koordinatörlük hücresi, çipler ve rol sekmeleri yalnız seçili
 * programın etiketlerinden; başka programın satırları gösterilmez (E-05-20).
 */
import type { TeamRole } from '@/shared/scope/standing-facts'

import { teamRoleOf } from './capabilities'
import type { KnownUser, MembershipLabel } from './types'

const SEPARATOR = ':'

/** Tek etiket; ayrıştırılamazsa `null`. */
export function parseMembershipLabel(label: string): MembershipLabel | null {
  const parts = label.split(SEPARATOR)
  if (parts.length !== 3) return null
  const [programId, departmentId, raw] = parts as [string, string, string]
  if (programId === '' || departmentId === '') return null
  const role = teamRoleOf(raw)
  return role ? { programId, departmentId, role } : null
}

/** Kullanıcının ayrıştırılabilen bütün etiketleri (`memberships: null` → boş). */
export function membershipLabels(user: Pick<KnownUser, 'memberships'>): MembershipLabel[] {
  const out: MembershipLabel[] = []
  for (const label of user.memberships ?? []) {
    const parsed = parseMembershipLabel(label)
    if (parsed) out.push(parsed)
  }
  return out
}

/** Seçili programın etiketleri (çip = (birim, rol); E-05-20, E-05-32). */
export function programMemberships(
  user: Pick<KnownUser, 'memberships'>,
  programId: string | null,
): MembershipLabel[] {
  if (programId === null) return []
  return membershipLabels(user).filter((m) => m.programId === programId)
}

/** Seçili programdaki roller (rozet, rol sekmesi; E-05-06, E-05-18). */
export function programRoles(
  user: Pick<KnownUser, 'memberships'>,
  programId: string | null,
): Set<TeamRole> {
  return new Set(programMemberships(user, programId).map((m) => m.role))
}

/** Rozet sırası: Koordinatör → Üye (E-05-18). */
export const ROLE_ORDER: readonly TeamRole[] = ['coordinator', 'member']

export function orderedRoles(roles: ReadonlySet<TeamRole>): TeamRole[] {
  return ROLE_ORDER.filter((role) => roles.has(role))
}
