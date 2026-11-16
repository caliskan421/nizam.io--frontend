/**
 * Silinenler özeti (`reportDeletedSummary`, S2, yalnız şirket yöneticisi; BE-110): tür segmenti
 * sayaçları ve alt başlık. Süzgeç almaz; süzülmüş küme boyu her listenin kendi `total` alanıdır.
 * `summary.total` ana sayfa `deleted_records` ile aynı hesaptır (REPORTING-K15). Okuyucu
 * `sessionBound` kapısından geçer, `signal`'i iletir; anahtar kapsamlıdır (program değişince düşer).
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { programHeaders, retryTransient } from '@/modules/work/public'
import { api, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

export function fetchDeletedSummary(programId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/admin/deleted/summary', {
      params: { header: programHeaders({ programId }) },
      signal,
    }),
  )
}

export function useDeletedSummary(enabled: MaybeRefOrGetter<boolean>) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      return {
        queryKey: queryKeys.deletedSummary.all(scope),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchDeletedSummary(scope.programId!, signal),
        ),
        enabled: scope.programId !== null && toValue(enabled),
        retry: retryTransient,
      }
    }),
  )
}
