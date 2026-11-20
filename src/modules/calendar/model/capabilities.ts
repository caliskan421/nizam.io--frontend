import { computed } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

export function useCalendarScope() {
  const store = useScopeStore()
  const { standing, status } = useStanding()
  const rows = computed(
    () => standing.value?.rows.filter((row) => row.programId === store.programId) ?? [],
  )
  const program = computed(() =>
    status.value === 'ready' && (standing.value?.companyAdmin || rows.value.length)
      ? store.programId
      : null,
  )
  const admin = computed(() => !!program.value && standing.value?.companyAdmin === true)
  const audience = computed(() =>
    JSON.stringify([
      store.snapshot,
      status.value,
      admin.value,
      rows.value.map((row) => [row.departmentId, row.role]).sort(),
    ]),
  )
  const canSeeRequests = computed(
    () => admin.value || rows.value.some((row) => row.role === 'coordinator'),
  )
  return { admin, audience, canSeeRequests, program, status, store }
}

export type CalendarScope = ReturnType<typeof useCalendarScope>
