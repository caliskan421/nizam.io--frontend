import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type QueryFunctionContext,
} from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { retryTransient } from '@/modules/work/public'
import type { MeetingDetail, MeetingFilters, NoteFilter } from '../model/types'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'
import { fetchMeetingCandidates } from './candidates'
import { fetchDeletedMeetings, fetchMeeting, fetchMeetingNotes, fetchMeetings } from './fetchers'

export function useMeetings(
  filters: MaybeRefOrGetter<MeetingFilters>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const store = useScopeStore()
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
  return { query, items, complete }
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

/** Detay tohumu (süzgeçsiz) yalnız `all` okumasına girer; süzgeçli okuma ayrı anahtardır (BE-061). */
export function useMeetingNotes(
  id: MaybeRefOrGetter<string | null>,
  filter: MaybeRefOrGetter<NoteFilter> = 'all',
) {
  const client = useQueryClient()
  const store = useScopeStore()
  return useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const meetingId = toValue(id)
      const selected = toValue(filter)
      return {
        queryKey: queryKeys.meetings.noteList(scope, meetingId ?? '', selected),
        initialData: () => {
          if (selected !== 'all') return undefined
          const detail = client.getQueryData<MeetingDetail>(
            queryKeys.meetings.detail(scope, meetingId ?? ''),
          )
          return detail ? { pages: [detail.notes], pageParams: [''] } : undefined
        },
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchMeetingNotes(
              scope.programId!,
              meetingId!,
              pageParam || undefined,
              signal,
              selected,
            ),
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

/** Aday kümesi tek uçtan (BE-067); `meetingId` null ise yeni toplantı taslağı (kuruluş kapısı). */
export function useMeetingCandidates(
  meetingId: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const id = toValue(meetingId)
      return {
        queryKey: queryKeys.meetings.candidates(scope, { meetingId: id }),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchMeetingCandidates(scope.programId!, id, signal),
        ),
        enabled: scope.programId !== null && toValue(enabled),
        retry: retryTransient,
      }
    }),
  )
}
