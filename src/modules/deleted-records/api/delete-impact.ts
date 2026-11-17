/**
 * Koordinatörlük silme etkisi (`departmentDeleteImpact`, S1, yalnız ŞY; BE-164, ADR-0043): program
 * ve departman başlığı YOKTUR — şirket geneli, bütün programların okuma anı görüntüsü. Her kalıcı
 * silme onayında taze okunur (`staleTime: 0`, önbellek tutulmaz); oturum kapısı `sessionBound`.
 */
import type { QueryClient, QueryFunctionContext } from '@tanstack/vue-query'

import { api, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { sessionBound } from '@/shared/session/query-session'

export function fetchDepartmentDeleteImpact(departmentId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/departments/{id}/delete-impact', {
      params: { path: { id: departmentId } },
      signal,
    }),
  )
}

export function readDepartmentDeleteImpact(client: QueryClient, departmentId: string) {
  return client.fetchQuery({
    queryKey: queryKeys.catalog.departmentDeleteImpact(departmentId),
    queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
      fetchDepartmentDeleteImpact(departmentId, signal),
    ),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}
