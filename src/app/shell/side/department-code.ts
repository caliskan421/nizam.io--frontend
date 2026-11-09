/**
 * Dar menü birim kodu (E-00-40). `MyDepartment` kod taşımaz; kod `listProgramDepartments`
 * (S2, `X-Nizamio-Program`) satırındaki `ProgramDepartment.code`'dan `department_id` ile
 * eşlenir; kod yoksa ya da okuma başarısızsa birim adının baş harfleri. Seçim listesi bu uçtan
 * KURULMAZ (istemci-akislari §2). Anahtar `scoped(['departments'])` (ortak-kurallar §6); bu
 * anahtarın TEK okuyucusu `shared/scope/standing.ts` `fetchProgramDepartments` — önbellek şekli
 * work / kabuk K7 / organizasyon okuyucularıyla aynı (`{ departments, truncated? }`; W71c).
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import { fetchProgramDepartments } from '@/shared/scope/standing'
import { sessionBound } from '@/shared/session/query-session'

import { departmentCode } from './program-avatar'
import { useSideScope } from './scope-view'

/** Paylaşılan anahtarın tek şekli (ortak okuyucunun dönüşü). */
type ProgramDepartmentList = Awaited<ReturnType<typeof fetchProgramDepartments>>

export function useDepartmentCode(
  active: Ref<boolean>,
  fetcher?: (programId: string | null, signal?: AbortSignal) => Promise<ProgramDepartmentList>,
) {
  const scope = useSideScope()
  const read =
    fetcher ??
    ((programId: string | null, signal?: AbortSignal) => fetchProgramDepartments(programId, signal))
  const enabled = computed(
    () =>
      active.value &&
      scope.lifecycle.status.value === 'ready' &&
      scope.showDepartment.value &&
      scope.department.value !== null,
  )
  const query = useQuery(
    computed(() => ({
      queryKey: queryKeys.departments.all(scope.store.snapshot),
      // Okuyucu kapısı + iptal sinyali (CX-F2-Ö-01): başka oturumda başlamış okuma bu oturuma
      // yazılmaz; çıkışta iptal edilen sorgunun isteği kesilir.
      queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
        read(scope.store.programId, signal),
      ),
      enabled: enabled.value,
      staleTime: 60_000,
    })),
  )
  const code = computed<string | null>(() => {
    const department = scope.department.value
    if (!department || !scope.showDepartment.value) return null
    const row = query.isError.value
      ? undefined
      : query.data.value?.departments.find((d) => d.department_id === department.departmentId)
    return departmentCode(row?.code, department.displayName)
  })
  return { code }
}
