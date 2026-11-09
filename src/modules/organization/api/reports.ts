/**
 * Rapor tabanlı okuma (08 `backend.md` ana karar; REPORTING-K01 — yalnız şirket yöneticisi).
 *
 *  - `reportDashboard` (S2): ana sayfa (01) ile AYNI anahtar (`queryKeys.report.dashboard`) ve
 *    ham `DashboardReport` şekli — pano paylaşılır, ikinci istek yok. Yazma sonrası geçersizleme
 *    yok, odakta tazelenir (ortak-kurallar §6).
 *  - `useCoordinatorships`: 08 kart ızgarası = `listProgramDepartments` ⋈
 *    `coordinatorship_stats[]` — ŞY'de TEK `listProgramDepartments` + TEK `reportDashboard`;
 *    birim başına istek yok (K3). 08b tek birim seçimi aynı kümeden (`findCoordinatorship`).
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { api, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'

import { joinCoordinatorships } from '../model/coordinatorships'
import { useProgramDepartmentIndex } from './departments'
import { programHeader, retryTransient } from './http'

export const DASHBOARD_STALE_MS = 60_000

export function fetchDashboard(programId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/reports/dashboard', { params: { header: programHeader(programId) }, signal }),
  )
}

/** Program panosu (yalnız ŞY; çağıran `enabled`'ı `readReport` capability'sinden verir). */
export function useOrganizationDashboard(enabled: MaybeRefOrGetter<boolean>) {
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

/**
 * 08 ızgarası ve 08b başlığı: `views` (ad sıralı), `departmentsTruncated` (E-08-03 "sınıra
 * ulaşmış olabilir"), `dashboard` (E-08-03 `total_users`, E-08-67 sezon ortalaması).
 * `withReport = false` iken rapor istenmez, kartlar statsız (yönetici olmayan; P16'da ekran yok).
 */
export function useCoordinatorships(withReport: MaybeRefOrGetter<boolean>) {
  const departments = useProgramDepartmentIndex()
  const dashboard = useOrganizationDashboard(withReport)
  const views = computed(() =>
    joinCoordinatorships(
      departments.departments.value,
      dashboard.data.value?.coordinatorship_stats ?? null,
    ),
  )
  return {
    views,
    departments: departments.query,
    dashboard,
    departmentsTruncated: departments.truncated,
    loading: computed(
      () => departments.query.isPending.value || (toValue(withReport) && dashboard.isPending.value),
    ),
  }
}
