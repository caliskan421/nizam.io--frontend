/**
 * Birim ekibi (E-K1-26/28): `listMembers` (S2, seçili birim, TEK istek; fan-out değil) —
 * organization modülünün okuyucusu (aynı anahtar, önbellek paylaşılır). Uç ŞY ve birim
 * koordinatörüne açıktır; hata/403 → boş liste. Yalnız canlı hesaplar; rol noktası
 * `isCoordinatorRole` (rol dizesi yalnız capabilities'te). `truncated` → liste eksik olabilir.
 */
import { computed, type MaybeRefOrGetter } from 'vue'

import { useDepartmentRoster } from '@/modules/organization/public'

import { isCoordinatorRole } from '../../model/capabilities'
import type { TeamMember } from '../../model/k1/team'

export function useRoster(
  department: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const roster = useDepartmentRoster(department, enabled)
  const members = computed<TeamMember[]>(() =>
    roster.active.value.map((m) => ({
      accountId: m.account_id,
      fullName: m.full_name,
      coordinator: isCoordinatorRole(m.role),
    })),
  )
  return { query: roster.query, members, truncated: roster.truncated }
}
