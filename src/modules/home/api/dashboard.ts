/**
 * `reportDashboard` (`GET /v1/reports/dashboard`, S2) — Admin KPI kaynağı (01 backend.md §1).
 * Yalnız şirket yöneticisi + Admin merceğinde etkin (REPORTING-K01; çağıran `canReadDashboard`).
 * Anahtar `queryKeys.report.dashboard` (ortak-kurallar §6): kapsamlıdır, kapsam değişince düşer
 * (K2). Yazma sonrası geçersizleme yok; odakta tazelenir. Ağır uç → `staleTime` 60 sn.
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { retryTransient } from '@/modules/work/public'
import { api, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'

export const DASHBOARD_STALE_MS = 60_000

/** Tek istek; program başlığı açıkça (S2). */
export function fetchDashboard(programId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/reports/dashboard', {
      params: { header: { 'X-Nizamio-Program': programId } },
      signal,
    }),
  )
}

export function useDashboard(enabled: MaybeRefOrGetter<boolean>) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      return {
        queryKey: queryKeys.report.dashboard(scope),
        queryFn: ({ signal }: QueryFunctionContext) =>
          fetchDashboard(scope.programId ?? '', signal),
        enabled: toValue(enabled) && scope.programId !== null,
        retry: retryTransient,
        staleTime: DASHBOARD_STALE_MS,
      }
    }),
  )
}
