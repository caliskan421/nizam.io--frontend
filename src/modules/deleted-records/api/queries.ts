/**
 * Silinen görev ve hesap okuyucuları (imleçli sonsuz sorgu; P4 "daha fazla yükle"). Her
 * okuyucu `sessionBound` kapısından geçer ve `signal`'i iletir (KESİN 26b). Görev anahtarı
 * kapsamlıdır (program değişince düşer, K2); hesap anahtarı hesap geneli olduğundan düşmez.
 * `enabled` yalnız açık sekme için doğrudur: etkin olmayan türün ucu çağrılmaz (fan-out yok).
 */
import { useInfiniteQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { retryTransient } from '@/modules/work/public'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import { DELETED_PAGE_LIMIT, fetchDeletedAccounts, fetchDeletedWorkItems } from './fetchers'

const LIST_FILTERS = { limit: DELETED_PAGE_LIMIT }

export function useDeletedWorkItems(enabled: MaybeRefOrGetter<boolean>) {
  const store = useScopeStore()
  return useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      return {
        queryKey: queryKeys.deletedWorkItems.list(scope, LIST_FILTERS),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchDeletedWorkItems(scope.programId!, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (page: Awaited<ReturnType<typeof fetchDeletedWorkItems>>) =>
          page.next_cursor || undefined,
        enabled: scope.programId !== null && toValue(enabled),
        retry: retryTransient,
      }
    }),
  )
}

export function useDeletedAccounts(enabled: MaybeRefOrGetter<boolean>) {
  return useInfiniteQuery(
    computed(() => ({
      queryKey: queryKeys.deletedAccounts.list(LIST_FILTERS),
      queryFn: sessionBound(
        ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
          fetchDeletedAccounts(pageParam || undefined, signal),
      ),
      initialPageParam: '',
      getNextPageParam: (page: Awaited<ReturnType<typeof fetchDeletedAccounts>>) =>
        page.next_cursor || undefined,
      enabled: toValue(enabled),
      retry: retryTransient,
    })),
  )
}
