/**
 * Birleşik silinenler listesi (`listDeletedRecords`, S2, yalnız şirket yöneticisi; ADR-0055):
 * dokuz tür tek sırada (silinme anı azalan). `scope=program` HER çağrıda açıkça gider (şirket
 * geneline sessiz düşüş yok). `kinds`, süzgeçler ve program imleci belirler: biri değişince yeni
 * sorgu anahtarı → ilk sayfa (bozuk/yabancı imleç 422 `cursor` olurdu). Sayfa `limit`'ten KISA
 * olabilir; bitiş yalnız boş `next_cursor`dur. Bilinmeyen `kind` ham öğede kalır (W193 satırı).
 */
import { useInfiniteQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { programHeaders, retryTransient } from '@/modules/work/public'
import { api, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import { kindsParam, type UnifiedQuery } from '../model/lifecycle'

/** Sunucu sınırı 1…100; varsayılan 50. */
export const UNIFIED_PAGE_LIMIT = 50

function params(query: UnifiedQuery, cursor: string | undefined) {
  const { kinds, ...rest } = query
  const kindList = kindsParam(kinds)
  return {
    limit: UNIFIED_PAGE_LIMIT,
    scope: 'program' as const,
    ...rest,
    ...(kindList ? { kinds: kindList } : {}),
    ...(cursor ? { cursor } : {}),
  }
}

export function fetchDeletedRecords(
  programId: string,
  query: UnifiedQuery,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/admin/deleted/records', {
      params: { header: programHeaders({ programId }), query: params(query, cursor) },
      signal,
    }),
  )
}

export function useDeletedRecords(
  query: MaybeRefOrGetter<UnifiedQuery>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const store = useScopeStore()
  return useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const q = toValue(query)
      const { kinds, ...rest } = q
      return {
        queryKey: queryKeys.deletedRecords.list(scope, {
          limit: UNIFIED_PAGE_LIMIT,
          scope: 'program',
          kinds: kindsParam(kinds) ?? null,
          ...rest,
        }),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchDeletedRecords(scope.programId!, q, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        // Kısa sayfa bitiş değildir: yalnız boş `next_cursor` durdurur.
        getNextPageParam: (last: Awaited<ReturnType<typeof fetchDeletedRecords>>) =>
          last.next_cursor || undefined,
        enabled: scope.programId !== null && toValue(enabled),
        retry: retryTransient,
      }
    }),
  )
}
