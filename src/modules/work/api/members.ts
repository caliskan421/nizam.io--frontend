/**
 * Görev atama adayları — `listMembers` (S2): departmanın SEÇİLİ PROGRAMDAKİ ekibi. Uç şirket
 * yöneticisine ve o departmanın koordinatörüne açıktır (görev açabilenler, s.139); başka
 * çağıranda 403 → boş liste (eylem zaten gizli). Aday dışı hesap `createWorkItem`'da 422
 * `work.assignee_not_member` alır.
 *
 * Yalnız görev ataması içindir: alt görev kişi seçicisi bu listeyi KULLANMAZ (yalnız ana göreve
 * atananlar, 03 `eksikler.md` §3). Anahtar `queryKeys.departments.members` (ortak-kurallar §6);
 * üyelik yazmaları geçersizler, kapsam değişince düşer (K2).
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { api } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { unwrapList } from '@/shared/http/truncation'
import { useScopeStore } from '@/shared/scope/store'

import type { ProgramTarget } from '../model/types'
import { programHeaders, retryTransient } from './http'

const STALE_MS = 30_000
const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

/** `listMembers` (S2; yalnız program başlığı); kesme bayrağı ortak yardımcıyla önbellekte. */
export function fetchDepartmentMembers(
  target: ProgramTarget,
  departmentId: string,
  signal?: AbortSignal,
) {
  return unwrapList(
    api.GET('/v1/departments/{id}/members', {
      params: { header: programHeaders(target), path: { id: departmentId } },
      signal,
    }),
  )
}

/**
 * Departman ekibinin canlı hesapları (`status: active`), ada göre (`tr`). `departmentId` `null`
 * iken istek yok. `status`: `idle` | `loading` | `ready` | `error` (403 dahil; liste boş).
 */
export function useDepartmentMembers(departmentId: MaybeRefOrGetter<string | null>) {
  const store = useScopeStore()
  const query = useQuery(
    computed(() => {
      const scope = store.snapshot
      const id = toValue(departmentId)
      return {
        queryKey: queryKeys.departments.members(scope, id ?? ''),
        queryFn: ({ signal }: QueryFunctionContext) =>
          fetchDepartmentMembers({ programId: scope.programId ?? '' }, id ?? '', signal),
        enabled: id !== null && id !== '' && scope.programId !== null,
        retry: retryTransient,
        staleTime: STALE_MS,
      }
    }),
  )
  const members = computed(() =>
    (query.data.value?.members ?? [])
      .filter((m) => m.status === 'active')
      .map((m) => ({ accountId: m.account_id, fullName: m.full_name }))
      .sort((a, b) => collator.compare(a.fullName, b.fullName)),
  )
  const status = computed(() => {
    const id = toValue(departmentId)
    if (id === null || id === '') return 'idle'
    if (query.isError.value) return 'error'
    return query.data.value ? 'ready' : 'loading'
  })
  return { query, members: computed(() => (query.isError.value ? [] : members.value)), status }
}
