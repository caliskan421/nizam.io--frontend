/**
 * Silinen kayıt listeleri (imleçli sonsuz sorgu; P4 "daha fazla yükle"). Her okuyucu
 * `sessionBound` kapısından geçer ve `signal`'i iletir (KESİN 26b). Sunucu süzgeci ve sırası
 * sorgu anahtarına girer (BE-117): süzgeç değişince yeni anahtar → ilk sayfa, eski imleç
 * kullanılmaz. Görev/toplantı/koordinatörlük anahtarları kapsamlıdır (program değişince düşer,
 * K2); hesap anahtarı hesap geneli olduğundan düşmez. `enabled` yalnız açık sekme için
 * doğrudur: etkin olmayan türün ucu çağrılmaz (fan-out yok).
 */
import { useInfiniteQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { retryTransient } from '@/modules/work/public'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import type { ListQuery } from '../model/filters'
import {
  DELETED_PAGE_LIMIT,
  fetchDeletedAccounts,
  fetchDeletedDepartments,
  fetchDeletedMeetings,
  fetchDeletedWorkItems,
} from './fetchers'

const filtersOf = (query: ListQuery) => ({ limit: DELETED_PAGE_LIMIT, ...query })

export function useDeletedWorkItems(
  query: MaybeRefOrGetter<ListQuery>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const store = useScopeStore()
  return useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const q = toValue(query)
      return {
        queryKey: queryKeys.deletedWorkItems.list(scope, filtersOf(q)),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchDeletedWorkItems(scope.programId!, q, pageParam || undefined, signal),
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

export function useDeletedMeetings(
  query: MaybeRefOrGetter<ListQuery>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const store = useScopeStore()
  return useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const q = toValue(query)
      return {
        queryKey: queryKeys.meetings.deletedList(scope, filtersOf(q)),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchDeletedMeetings(scope.programId!, q, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (page: Awaited<ReturnType<typeof fetchDeletedMeetings>>) =>
          page.next_cursor || undefined,
        enabled: scope.programId !== null && toValue(enabled),
        retry: retryTransient,
      }
    }),
  )
}

export function useDeletedDepartments(
  query: MaybeRefOrGetter<ListQuery>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const store = useScopeStore()
  return useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const q = toValue(query)
      return {
        queryKey: queryKeys.deletedDepartments.list(scope, filtersOf(q)),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchDeletedDepartments(scope.programId!, q, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (page: Awaited<ReturnType<typeof fetchDeletedDepartments>>) =>
          page.next_cursor || undefined,
        enabled: scope.programId !== null && toValue(enabled),
        retry: retryTransient,
      }
    }),
  )
}

export function useDeletedAccounts(
  query: MaybeRefOrGetter<ListQuery>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  return useInfiniteQuery(
    computed(() => {
      const q = toValue(query)
      return {
        queryKey: queryKeys.deletedAccounts.list(filtersOf(q)),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchDeletedAccounts(q, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (page: Awaited<ReturnType<typeof fetchDeletedAccounts>>) =>
          page.next_cursor || undefined,
        enabled: toValue(enabled),
        retry: retryTransient,
      }
    }),
  )
}
