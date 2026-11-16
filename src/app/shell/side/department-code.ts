/**
 * Dar menü birim kodu (E-00-40). Kod `MyDepartment.department_code` alanındadır (ORGANIZATION-K63,
 * pin v0.23.0-api): `GET /v1/me/departments` satırı `(program, departman)` ile eşlenir; kod yoksa
 * (`null`) ya da okuma başarısızsa birim adının baş harfleri. Eski yol (S2 `listProgramDepartments`
 * satırındaki `ProgramDepartment.code`) KALDIRILDI: ek istek yok, seçim listesi bu uçtan kurulmaz.
 * Anahtar standing'in `me/departments` anahtarıdır (`STANDING_KEYS.myDepartments`; aynı okuyucu,
 * aynı önbellek girdisi, tek istek).
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { fetchMyDepartments, STANDING_KEYS } from '@/shared/scope/standing'
import { sessionBound } from '@/shared/session/query-session'

import { departmentCode } from './program-avatar'
import { useSideScope } from './scope-view'

/** Paylaşılan anahtarın tek şekli (ortak okuyucunun dönüşü). */
type MyDepartments = Awaited<ReturnType<typeof fetchMyDepartments>>

export function useDepartmentCode(
  active: Ref<boolean>,
  fetcher?: (signal?: AbortSignal) => Promise<MyDepartments>,
) {
  const scope = useSideScope()
  const read = fetcher ?? ((signal?: AbortSignal) => fetchMyDepartments(signal))
  const enabled = computed(
    () =>
      active.value &&
      scope.lifecycle.status.value === 'ready' &&
      scope.showDepartment.value &&
      scope.department.value !== null,
  )
  const query = useQuery(
    computed(() => ({
      queryKey: STANDING_KEYS.myDepartments,
      // Okuyucu kapısı + iptal sinyali (CX-F2-Ö-01): başka oturumda başlamış okuma bu oturuma
      // yazılmaz; çıkışta iptal edilen sorgunun isteği kesilir.
      queryFn: sessionBound(({ signal }: QueryFunctionContext) => read(signal)),
      enabled: enabled.value,
      staleTime: 60_000,
    })),
  )
  const code = computed<string | null>(() => {
    const department = scope.department.value
    if (!department || !scope.showDepartment.value) return null
    const row = query.isError.value
      ? undefined
      : query.data.value?.data.departments?.find(
          (d) =>
            d.department_id === department.departmentId && d.program_id === scope.store.programId,
        )
    return departmentCode(row?.department_code, department.displayName)
  })
  return { code }
}
