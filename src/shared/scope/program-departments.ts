/**
 * `listProgramDepartments` — ad/kod sözlüğü (E-03-20/22, bütün roller), Admin koordinatörlük
 * süzgeci seçenekleri (E-03-12) ve rapor bölümü penceresi çipleri (E-13-05). Anahtar
 * `scoped(['departments'])` (ortak-kurallar §6); tek okuyucu burasıdır. Work ve reports modülleri
 * aynı okuyucuyu kullanır; reports'un work'e bağımlı olması modül döngüsü yaratıyordu (W142 KUSUR 4),
 * bu yüzden okuyucu shared'dadır (`work/public.ts` aynı adla yeniden dışa açar).
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { retryTransient } from '@/shared/http/retry'
import { queryKeys } from '@/shared/http/query-keys'
import { sessionBound } from '@/shared/session/query-session'

import { fetchProgramDepartments } from './standing'
import { useScopeStore } from './store'

const STALE_MS = 30_000

export function useProgramDepartments(enabled: MaybeRefOrGetter<boolean> = true) {
  const store = useScopeStore()
  const query = useQuery(
    computed(() => {
      const scope = store.snapshot
      return {
        queryKey: queryKeys.departments.all(scope),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchProgramDepartments(scope.programId ?? '', signal),
        ),
        enabled: scope.programId !== null && toValue(enabled),
        retry: retryTransient,
        staleTime: STALE_MS,
      }
    }),
  )
  const byId = computed(
    () => new Map((query.data.value?.departments ?? []).map((d) => [d.department_id, d])),
  )
  return { query, byId }
}
