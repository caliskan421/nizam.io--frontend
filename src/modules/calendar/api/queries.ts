import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed } from 'vue'

import { clientError } from '@/shared/errors/api-error'
import { api, unwrap } from '@/shared/http'
import { unwrapList } from '@/shared/http/truncation'
import { queryKeys } from '@/shared/http/query-keys'
import { sessionBound } from '@/shared/session/query-session'

import type { CalendarScope } from '../model/capabilities'
import type { DateRange } from '../model/calendar'

export function useCalendarRange(scope: CalendarScope, range: () => DateRange) {
  return useQuery(
    computed(() => {
      const audience = scope.audience.value
      const program = scope.program.value
      const query = range()
      return {
        queryKey: queryKeys.calendar.range(scope.store.snapshot, { ...query, audience }),
        enabled: program !== null,
        retry: false,
        queryFn: sessionBound(async ({ signal }: QueryFunctionContext) => {
          if (!program || audience !== scope.audience.value)
            throw clientError('client.scope_missing')
          const data = await unwrapList(
            api.GET('/v1/calendar', {
              params: { query, header: { 'X-Nizamio-Program': program } },
              cache: 'no-store',
              signal,
            }),
          )
          if (audience !== scope.audience.value) throw clientError('client.scope_missing')
          return data
        }),
      }
    }),
  )
}

export function useMilestones(scope: CalendarScope, opened: () => boolean) {
  return useQuery(
    computed(() => {
      const program = scope.program.value
      const audience = scope.audience.value
      return {
        queryKey: queryKeys.calendar.milestones(scope.store.snapshot, { audience }),
        enabled: !!program && scope.admin.value && opened(),
        retry: false,
        queryFn: sessionBound(async ({ signal }: QueryFunctionContext) => {
          if (!program || !scope.admin.value || audience !== scope.audience.value) {
            throw clientError('client.scope_missing')
          }
          const result = unwrap(
            api.GET('/v1/programs/{id}/milestones', {
              params: { path: { id: program } },
              cache: 'no-store',
              signal,
            }),
          )
          const data = await result
          if (audience !== scope.audience.value) throw clientError('client.scope_missing')
          return data
        }),
      }
    }),
  )
}
