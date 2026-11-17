/**
 * Yeni çocuk türlerin silinen kayıt listeleri (imleçli sonsuz sorgu). `queries.ts` ile aynı kural:
 * `sessionBound` + `signal`, kapsamlı anahtar (program değişince düşer), `enabled` yalnız açık
 * tür için (fan-out yok), süzgeç/sıra anahtara girer.
 */
import { useInfiniteQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { retryTransient } from '@/modules/work/public'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import type { ListQuery } from '../model/filters'
import { DELETED_PAGE_LIMIT } from './fetchers'
import {
  fetchDeletedAgendaItems,
  fetchDeletedFiles,
  fetchDeletedMeetingNotes,
  fetchDeletedSubtasks,
  fetchDeletedTaskNotes,
} from './fetchers-child'

const filtersOf = (query: ListQuery) => ({ limit: DELETED_PAGE_LIMIT, ...query })

export function useDeletedFiles(
  query: MaybeRefOrGetter<ListQuery>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const store = useScopeStore()
  return useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const q = toValue(query)
      return {
        queryKey: queryKeys.deletedFiles.list(scope, filtersOf(q)),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchDeletedFiles(scope.programId!, q, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (last: Awaited<ReturnType<typeof fetchDeletedFiles>>) =>
          last.next_cursor || undefined,
        enabled: scope.programId !== null && toValue(enabled),
        retry: retryTransient,
      }
    }),
  )
}

export function useDeletedSubtasks(
  query: MaybeRefOrGetter<ListQuery>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const store = useScopeStore()
  return useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const q = toValue(query)
      return {
        queryKey: queryKeys.deletedSubtasks.list(scope, filtersOf(q)),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchDeletedSubtasks(scope.programId!, q, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (last: Awaited<ReturnType<typeof fetchDeletedSubtasks>>) =>
          last.next_cursor || undefined,
        enabled: scope.programId !== null && toValue(enabled),
        retry: retryTransient,
      }
    }),
  )
}

export function useDeletedTaskNotes(
  query: MaybeRefOrGetter<ListQuery>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const store = useScopeStore()
  return useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const q = toValue(query)
      return {
        queryKey: queryKeys.deletedTaskNotes.list(scope, filtersOf(q)),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchDeletedTaskNotes(scope.programId!, q, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (last: Awaited<ReturnType<typeof fetchDeletedTaskNotes>>) =>
          last.next_cursor || undefined,
        enabled: scope.programId !== null && toValue(enabled),
        retry: retryTransient,
      }
    }),
  )
}

export function useDeletedMeetingNotes(
  query: MaybeRefOrGetter<ListQuery>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const store = useScopeStore()
  return useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const q = toValue(query)
      return {
        queryKey: queryKeys.deletedMeetingNotes.list(scope, filtersOf(q)),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchDeletedMeetingNotes(scope.programId!, q, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (last: Awaited<ReturnType<typeof fetchDeletedMeetingNotes>>) =>
          last.next_cursor || undefined,
        enabled: scope.programId !== null && toValue(enabled),
        retry: retryTransient,
      }
    }),
  )
}

export function useDeletedAgendaItems(
  query: MaybeRefOrGetter<ListQuery>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const store = useScopeStore()
  return useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const q = toValue(query)
      return {
        queryKey: queryKeys.deletedAgendaItems.list(scope, filtersOf(q)),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchDeletedAgendaItems(scope.programId!, q, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (last: Awaited<ReturnType<typeof fetchDeletedAgendaItems>>) =>
          last.next_cursor || undefined,
        enabled: scope.programId !== null && toValue(enabled),
        retry: retryTransient,
      }
    }),
  )
}
