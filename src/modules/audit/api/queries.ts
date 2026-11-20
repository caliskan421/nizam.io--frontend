import { useInfiniteQuery, useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed } from 'vue'

import { clientError } from '@/shared/errors/api-error'
import { api, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { sessionBound } from '@/shared/session/query-session'

import { useAuditScope } from '../model/access'
import type { AuditEntryList, AuditQuery } from '../model/types'

export function useAuditEntries(filters: () => AuditQuery | null, limit = 50) {
  const { store: scope, programId, audience } = useAuditScope()
  return useInfiniteQuery(
    computed(() => {
      const requested = filters()
      const query = requested?.program_id === programId.value ? requested : null
      const authority = audience.value
      return {
        queryKey: queryKeys.audit.entries(
          scope.snapshot,
          query ? { ...query, audience: authority } : {},
          limit,
        ),
        queryFn: sessionBound(
          async ({
            pageParam,
            signal,
          }: QueryFunctionContext<readonly unknown[], string | null>) => {
            if (!query || query.program_id !== programId.value || authority !== audience.value) {
              throw clientError('client.scope_missing')
            }
            return unwrap(
              api.GET('/v1/audit/entries', {
                params: {
                  query: { ...query, limit, ...(pageParam ? { cursor: pageParam } : {}) },
                },
                signal,
                cache: 'no-store',
              }),
            )
          },
        ),
        enabled: query !== null,
        initialPageParam: null as string | null,
        getNextPageParam: (page: AuditEntryList) => page.next_cursor ?? undefined,
        retry: false,
        staleTime: 15_000,
      }
    }),
  )
}

export function useAuditSummary(filters: () => AuditQuery | null) {
  const { store: scope, programId, audience } = useAuditScope()
  return useQuery(
    computed(() => {
      const requested = filters()
      const query = requested?.program_id === programId.value ? requested : null
      const authority = audience.value
      return {
        queryKey: queryKeys.audit.summary(
          scope.snapshot,
          query ? { ...query, audience: authority } : {},
        ),
        enabled: query !== null,
        queryFn: sessionBound(async ({ signal }: QueryFunctionContext) => {
          if (!query || query.program_id !== programId.value || authority !== audience.value) {
            throw clientError('client.scope_missing')
          }
          return unwrap(
            api.GET('/v1/audit/summary', {
              params: { query },
              signal,
              cache: 'no-store',
            }),
          )
        }),
        retry: false,
        staleTime: 15_000,
      }
    }),
  )
}

export function useAuditActions(enabled: () => boolean) {
  const { store: scope, programId } = useAuditScope()
  return useQuery(
    computed(() => ({
      enabled: enabled() && programId.value !== null,
      queryKey: queryKeys.audit.actions(scope.snapshot),
      queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
        unwrap(api.GET('/v1/audit/action-types', { signal })),
      ),
      retry: false,
      staleTime: 60_000,
    })),
  )
}
