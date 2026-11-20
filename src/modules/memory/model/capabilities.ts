import { computed } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

export function useMemoryScope() {
  const store = useScopeStore()
  const standing = useStanding()
  const rows = computed(
    () => standing.standing.value?.rows.filter((row) => row.programId === store.programId) ?? [],
  )
  const admin = computed(() => standing.standing.value?.companyAdmin === true)
  const program = computed(() =>
    standing.status.value === 'ready' && (admin.value || rows.value.length)
      ? store.programId
      : null,
  )
  const audience = computed(() =>
    JSON.stringify([
      standing.standing.value?.accountId,
      admin.value,
      rows.value.map((row) => [row.departmentId, row.role]).sort(),
    ]),
  )
  const conversionDepartments = computed(() =>
    rows.value.filter((row) => row.role === 'coordinator').map((row) => row.departmentId),
  )
  return { store, program, audience, admin, conversionDepartments, programs: standing.programs }
}
