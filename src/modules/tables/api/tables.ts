import {
  useInfiniteQuery,
  useQuery,
  type QueryFunctionContext,
  type QueryKey,
} from '@tanstack/vue-query'
import { computed, type ComputedRef, type Ref } from 'vue'

import { useKeyedOrgMutation } from '@/modules/organization/public'
import { programHeaders, scopeHeaders } from '@/modules/work/public'
import { ApiError } from '@/shared/errors/api-error'
import { api, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { retryTransient } from '@/shared/http/retry'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { sessionBound } from '@/shared/session/query-session'

import type {
  DepartmentCreate,
  PersonalCreate,
  TableCreateRequest,
  TableList,
  TableResult,
  TableSnapshot,
  TableTarget,
} from '../model/types'

const noScope: ScopeSnapshot = { programId: null, departmentId: null }

export function fetchTables(target: TableTarget, cursor?: string, signal?: AbortSignal) {
  const query = cursor === undefined ? {} : { cursor }
  const { departmentId } = target
  if (departmentId === null) {
    return unwrap(
      api.GET('/v1/personal/tables', {
        params: { header: programHeaders(target), query },
        signal,
      }),
    )
  }
  return unwrap(
    api.GET('/v1/tables', {
      params: { header: scopeHeaders({ ...target, departmentId }), query },
      signal,
    }),
  )
}

// JSON metinlerini bir bütün olarak eşleştir: kaçışlı hücre metni içindeki "value" alan değildir.
const CELL_NUMBER =
  /"value"(\s*:\s*)(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=\s*[,}])|"(?:\\[\s\S]|[^"\\])*"/gu

/** Salt okunur sayıda sunucunun ondalık belirtecini, JavaScript Number'a uğratmadan göster. */
function decodeSnapshot(body: string): TableSnapshot {
  try {
    const exact = body.replace(CELL_NUMBER, (token: string, space?: string, number?: string) =>
      number === undefined ? token : `"value"${space}"${number}"`,
    )
    return JSON.parse(exact) as TableSnapshot
  } catch (cause) {
    throw new ApiError({ code: 'client.invalid_response', cause })
  }
}

export async function fetchTable(
  target: TableTarget,
  tableID: string,
  cursor?: string,
  signal?: AbortSignal,
) {
  const path = { tableID }
  const query = cursor === undefined ? {} : { cursor }
  const { departmentId } = target
  const body =
    departmentId === null
      ? await unwrap(
          api.GET('/v1/personal/tables/{tableID}', {
            params: { header: programHeaders(target), path, query },
            signal,
            parseAs: 'text',
          }),
        )
      : await unwrap(
          api.GET('/v1/tables/{tableID}', {
            params: { header: scopeHeaders({ ...target, departmentId }), path, query },
            signal,
            parseAs: 'text',
          }),
        )
  return decodeSnapshot(body)
}

export function useTables(target: ComputedRef<TableTarget | null>, enabled: ComputedRef<boolean>) {
  return useInfiniteQuery(
    computed(() => {
      const current = target.value
      return {
        queryKey: queryKeys.tables.list(current ?? noScope),
        initialPageParam: '',
        queryFn: sessionBound(({ signal, pageParam }: QueryFunctionContext<QueryKey, string>) =>
          current
            ? fetchTables(current, pageParam || undefined, signal)
            : Promise.reject(new Error('table scope missing')),
        ),
        getNextPageParam: (page: TableList) => page.next_cursor || undefined,
        enabled: current !== null && enabled.value,
        retry: retryTransient,
      }
    }),
  )
}

export function useTable(
  target: ComputedRef<TableTarget | null>,
  id: ComputedRef<string | null>,
  cursor: Ref<string | null>,
) {
  return useQuery(
    computed(() => {
      const current = target.value
      const tableID = id.value
      const pageCursor = cursor.value
      return {
        queryKey: queryKeys.tables.detail(current ?? noScope, tableID ?? '', pageCursor),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          current && tableID
            ? fetchTable(current, tableID, pageCursor ?? undefined, signal)
            : Promise.reject(new Error('table scope missing')),
        ),
        enabled: current !== null && tableID !== null,
        retry: retryTransient,
      }
    }),
  )
}

export function useCreateTable(scope: () => TableTarget) {
  const personal = useKeyedOrgMutation<PersonalCreate, TableResult>({
    operation: 'createPersonalTable',
    scope,
    send: (vars, ctx) =>
      api.POST('/v1/personal/tables', {
        params: { header: { ...programHeaders(vars), 'Idempotency-Key': ctx.idempotencyKey } },
        body: vars.body,
        signal: ctx.signal,
      }),
  })
  const department = useKeyedOrgMutation<DepartmentCreate, TableResult>({
    operation: 'createTable',
    scope,
    send: (vars, ctx) =>
      api.POST('/v1/tables', {
        params: { header: { ...scopeHeaders(vars), 'Idempotency-Key': ctx.idempotencyKey } },
        body: vars.body,
        signal: ctx.signal,
      }),
  })
  return async ({ programId, departmentId }: TableTarget, name: string) => {
    const body: TableCreateRequest = { name }
    return departmentId === null
      ? personal.submit({ programId, body })
      : department.submit({ programId, departmentId, body })
  }
}
