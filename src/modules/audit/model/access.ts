import { computed } from 'vue'

import type { Standing } from '@/shared/scope/standing-facts'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

export function canReadProgramAudit(standing: Standing | null, programId: string | null): boolean {
  return Boolean(
    programId &&
    standing &&
    (standing.companyAdmin || standing.rows.some((row) => row.programId === programId)),
  )
}

/** Mercek erişim vermez. Aktif program olmadan liste, özet ve dışa aktarım açılmaz. */
export function useAuditScope() {
  const store = useScopeStore()
  const { standing, status } = useStanding()
  const programId = computed(() =>
    status.value === 'ready' && canReadProgramAudit(standing.value, store.programId)
      ? store.programId
      : null,
  )
  const audience = computed(() =>
    standing.value?.companyAdmin
      ? 'company'
      : (standing.value?.rows
          .filter((row) => row.programId === programId.value)
          .map((row) => `${row.departmentId}:${row.role}`)
          .sort()
          .join(',') ?? ''),
  )
  return { programId, standing, status, store, audience }
}
