import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { retryTransient } from '@/modules/work/public'
import { queryKeys } from '@/shared/http/query-keys'
import { fetchProgramDepartments } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

/** Kabukla aynı kapsam anahtarı ve okuyucusu; kod yoksa çağıran adla yedekler. */
export function useDepartments() {
  const scope = useScopeStore()
  const query = useQuery(
    computed(() => {
      const snapshot = scope.snapshot
      return {
        queryKey: queryKeys.departments.all(snapshot),
        queryFn: sessionBound(({ signal }: { signal: AbortSignal }) =>
          fetchProgramDepartments(snapshot.programId, signal),
        ),
        enabled: snapshot.programId !== null,
        retry: retryTransient,
      }
    }),
  )
  return computed(() => query.data.value?.departments ?? [])
}
