/**
 * Dar menü birim kodu (E-00-40). `MyDepartment` kod taşımaz; kod `listProgramDepartments`
 * (S2, `X-Nizamio-Program`) satırındaki `ProgramDepartment.code`'dan `department_id` ile
 * eşlenir; kod yoksa ya da okuma başarısızsa birim adının baş harfleri. Seçim listesi bu uçtan
 * KURULMAZ (istemci-akislari §2). Anahtar `scoped(['departments'])` (ortak-kurallar §6).
 */
import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

import type { components } from '@/shared/api/schema'
import { api, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'

import { departmentCode } from './program-avatar'
import { useSideScope } from './scope-view'

type ProgramDepartment = components['schemas']['ProgramDepartment']

export async function fetchProgramDepartments(): Promise<ProgramDepartment[]> {
  const list = await unwrap(api.GET('/v1/program/departments'))
  return list.departments
}

export function useDepartmentCode(
  active: Ref<boolean>,
  fetcher: () => Promise<ProgramDepartment[]> = fetchProgramDepartments,
) {
  const scope = useSideScope()
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
      queryFn: fetcher,
      enabled: enabled.value,
      staleTime: 60_000,
    })),
  )
  const code = computed<string | null>(() => {
    const department = scope.department.value
    if (!department || !scope.showDepartment.value) return null
    const row = query.isError.value
      ? undefined
      : query.data.value?.find((d) => d.department_id === department.departmentId)
    return departmentCode(row?.code, department.displayName)
  })
  return { code }
}
