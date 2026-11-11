import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type QueryFunctionContext,
} from '@tanstack/vue-query'
import { computed, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { retryTransient } from '@/modules/work/public'
import { coordinatorDepartmentIds } from '../model/capabilities'
import type { MeetingDetail, MeetingFilters } from '../model/types'
import { authSession } from '@/shared/http'
import { ownerLife } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import type { Standing } from '@/shared/scope/standing-facts'
import { sessionBound } from '@/shared/session/query-session'
import { adminCandidates, coordinatorCandidates } from './candidates'
import { fetchDeletedMeetings, fetchMeeting, fetchMeetingNotes, fetchMeetings } from './fetchers'

function useListLifetime(
  filters: MaybeRefOrGetter<MeetingFilters>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const store = useScopeStore()
  let version = 0
  const stopFilters = watch(
    () => JSON.stringify([toValue(filters), toValue(enabled)]),
    () => {
      version += 1
    },
    { flush: 'sync' },
  )
  const stopScope = store.onChange(() => {
    version += 1
  })
  const owner = ownerLife(() => {
    stopFilters()
    stopScope()
  })
  return () => {
    const started = version
    const generation = authSession.generation
    const accountId = authSession.snapshot.accountId
    return () =>
      owner.alive() &&
      version === started &&
      authSession.generation === generation &&
      authSession.snapshot.accountId === accountId
  }
}

export function useMeetings(
  filters: MaybeRefOrGetter<MeetingFilters>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const store = useScopeStore()
  const lifetime = useListLifetime(filters, enabled)
  const query = useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const selected = { ...toValue(filters) }
      delete selected.cursor
      delete selected.limit
      return {
        queryKey: queryKeys.meetings.list(scope, selected),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchMeetings(
              scope.programId!,
              { ...selected, cursor: pageParam || undefined },
              signal,
            ),
        ),
        initialPageParam: '',
        getNextPageParam: (page: Awaited<ReturnType<typeof fetchMeetings>>) =>
          page.next_cursor || undefined,
        enabled: scope.programId !== null && toValue(enabled),
        retry: retryTransient,
      }
    }),
  )
  const items = computed(() => query.data.value?.pages.flatMap((page) => page.items) ?? [])
  const complete = computed(() => query.data.value !== undefined && !query.hasNextPage.value)
  async function loadAll() {
    const current = lifetime()
    const visited = new Set<string>()
    while (query.hasNextPage.value && current() && toValue(enabled)) {
      const cursor = query.data.value?.pages.at(-1)?.next_cursor
      if (!cursor || visited.has(cursor)) throw new Error('Tekrarlanan toplantı imleci')
      visited.add(cursor)
      const result = await query.fetchNextPage()
      if (result.isError) throw result.error
    }
  }
  return { query, items, complete, loadAll }
}

export function useMeeting(id: MaybeRefOrGetter<string | null>) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const meetingId = toValue(id)
      return {
        queryKey: queryKeys.meetings.detail(scope, meetingId ?? ''),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchMeeting(scope.programId!, meetingId!, signal),
        ),
        enabled: scope.programId !== null && meetingId !== null,
        retry: retryTransient,
      }
    }),
  )
}

export function useMeetingNotes(id: MaybeRefOrGetter<string | null>) {
  const client = useQueryClient()
  const store = useScopeStore()
  return useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const meetingId = toValue(id)
      return {
        queryKey: queryKeys.meetings.noteList(scope, meetingId ?? ''),
        initialData: () => {
          const detail = client.getQueryData<MeetingDetail>(
            queryKeys.meetings.detail(scope, meetingId ?? ''),
          )
          return detail ? { pages: [detail.notes], pageParams: [''] } : undefined
        },
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchMeetingNotes(scope.programId!, meetingId!, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (page: Awaited<ReturnType<typeof fetchMeetingNotes>>) =>
          page.next_cursor || undefined,
        enabled: scope.programId !== null && meetingId !== null,
        retry: retryTransient,
      }
    }),
  )
}

export function useDeletedMeetings(enabled: MaybeRefOrGetter<boolean>) {
  const store = useScopeStore()
  return useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      return {
        queryKey: queryKeys.meetings.deleted(scope),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchDeletedMeetings(scope.programId!, pageParam || undefined, signal),
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

/** Aday kümesi seçili programın standing olgularından okunur. */
export function useMeetingCandidates(
  standing: MaybeRefOrGetter<Standing | null>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const actor = toValue(standing)
      const isAdmin = actor?.companyAdmin === true
      const departments = coordinatorDepartmentIds(actor, scope.programId)
      return {
        queryKey: queryKeys.meetings.candidates(scope, { admin: isAdmin, departments }),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          isAdmin
            ? adminCandidates(scope.programId!, signal)
            : coordinatorCandidates(scope.programId!, departments, signal),
        ),
        enabled:
          scope.programId !== null && toValue(enabled) && (isAdmin || departments.length > 0),
        retry: retryTransient,
      }
    }),
  )
}
