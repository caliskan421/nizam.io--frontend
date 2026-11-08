/**
 * Görev okuma composable'ları (TanStack Query). Anahtarlar YALNIZ `shared/http/query-keys.ts`
 * fabrikasından (ortak-kurallar §6, CX-T-01) ve seçili kapsamın anlık görüntüsüyle kurulur:
 * kapsam değişince hepsi düşer (K2). İstek başlıkları anahtarla aynı anlık görüntüden (liste)
 * ya da görevin kendi kapsamından (ayrıntı uçları) gelir.
 *
 * Yetki kaybı (403/404 K6 kodları) sorgu hatası olarak kapsam yaşam döngüsünce dinlenir.
 */
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryFunctionContext,
  type QueryKey,
} from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import { fetchMyDepartments } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import { resolveTarget } from '../model/target'
import type { WorkItem, WorkItemList, WorkItemResource, WorkTarget } from '../model/types'
import {
  fetchFiles,
  fetchNotes,
  fetchProgramDepartments,
  fetchSubtasks,
  fetchWorkItem,
  fetchWorkItemPage,
} from './fetchers'
import { retryTransient } from './http'

const STALE_MS = 30_000

/**
 * Görev listesi — `listProgramWorkItems` imleçli sonsuz sorgu (`limit` 200). `department` tek
 * değerdir (`listDepartmentFilter`; K3). "Daha fazla yükle" = `fetchNextPage()` (aynı uç, aynı
 * süzgeç; fan-out değil, §9). `complete` imleç bittiğinde `true`: yalnız o zaman sayaçlar
 * kesindir; aksi "yüklenen kayıtlar içinde" (§10, P4). İmleç URL'de taşınmaz.
 */
export function useWorkItemList(department: MaybeRefOrGetter<string | null>) {
  const store = useScopeStore()
  const query = useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const departmentId = toValue(department)
      const programId = scope.programId
      return {
        queryKey: queryKeys.workItems.list(scope, { department: departmentId }),
        queryFn: ({ pageParam, signal }: QueryFunctionContext<QueryKey, string | undefined>) =>
          fetchWorkItemPage({ programId: programId ?? '' }, departmentId, pageParam, signal),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (last: WorkItemList) => last.next_cursor || undefined,
        enabled: programId !== null,
        retry: retryTransient,
        staleTime: STALE_MS,
      }
    }),
  )
  const items = computed<WorkItem[]>(
    () => query.data.value?.pages.flatMap((page) => page.items) ?? [],
  )
  const complete = computed(
    () => query.data.value !== undefined && query.hasNextPage.value === false,
  )
  return { query, items, complete }
}

function itemQuery<D>(
  part: WorkItemResource,
  workItemId: MaybeRefOrGetter<string | null>,
  target: MaybeRefOrGetter<WorkTarget | null>,
  fetcher: (target: WorkTarget, id: string, signal?: AbortSignal) => Promise<D>,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const id = toValue(workItemId)
      const resolved = toValue(target)
      const scope = store.snapshot
      return {
        queryKey: queryKeys.workItems[part](scope, id ?? ''),
        queryFn: ({ signal }: QueryFunctionContext) =>
          fetcher(resolved ?? { programId: '', departmentId: '' }, id ?? '', signal),
        enabled: id !== null && resolved !== null && scope.programId !== null,
        retry: retryTransient,
        staleTime: STALE_MS,
      }
    }),
  )
}

/** `getWorkItem` — ayrıntı paneli (E-03-41…49). Hedef bilinmiyorsa istek yok. */
export function useWorkItem(
  workItemId: MaybeRefOrGetter<string | null>,
  target: MaybeRefOrGetter<WorkTarget | null>,
) {
  return itemQuery('item', workItemId, target, fetchWorkItem)
}

/** `listWorkItemSubtasks` — satır içi blok ve panel sekmesi AYNI sorgu (E-03-21, E-03-60). */
export function useWorkItemSubtasks(
  workItemId: MaybeRefOrGetter<string | null>,
  target: MaybeRefOrGetter<WorkTarget | null>,
) {
  return itemQuery('subtasks', workItemId, target, fetchSubtasks)
}

/** `listWorkItemFiles` — 03/03c/06 ortak anahtar (E-03-35, E-03-50, E-03-61). */
export function useWorkItemFiles(
  workItemId: MaybeRefOrGetter<string | null>,
  target: MaybeRefOrGetter<WorkTarget | null>,
) {
  return itemQuery('files', workItemId, target, fetchFiles)
}

/** `listWorkItemNotes` — Notlar sekmesi (E-03-62). */
export function useWorkItemNotes(
  workItemId: MaybeRefOrGetter<string | null>,
  target: MaybeRefOrGetter<WorkTarget | null>,
) {
  return itemQuery('notes', workItemId, target, fetchNotes)
}

/**
 * Yalnız kimlik bilinirken (derin bağlantı `?gorev=`) hedef: yüklenmiş liste sayfalarındaki
 * satır → görevin kendi kapsamı; yoksa K/Ü merceğinde seçili birim; Admin merceğinde `null`.
 */
export function useWorkItemTarget(workItemId: MaybeRefOrGetter<string | null>) {
  const store = useScopeStore()
  const client = useQueryClient()
  return computed<WorkTarget | null>(() => {
    const id = toValue(workItemId)
    if (id === null) return null
    const scope = store.snapshot
    const lists = client.getQueriesData<InfiniteData<WorkItemList>>({
      queryKey: queryKeys.workItems.all(scope),
    })
    const listed = lists.flatMap(([, data]) =>
      data && 'pages' in data ? data.pages.flatMap((page) => page.items) : [],
    )
    return resolveTarget(id, scope, listed)
  })
}

/**
 * `listProgramDepartments` — ad/kod sözlüğü (E-03-20/22, bütün roller) ve Admin
 * koordinatörlük süzgeci seçenekleri (E-03-12). Anahtar `scoped(['departments'])`.
 */
export function useProgramDepartments() {
  const store = useScopeStore()
  const query = useQuery(
    computed(() => {
      const scope = store.snapshot
      return {
        queryKey: queryKeys.departments.all(scope),
        queryFn: ({ signal }: QueryFunctionContext) =>
          fetchProgramDepartments({ programId: scope.programId ?? '' }, signal),
        enabled: scope.programId !== null,
        retry: retryTransient,
        staleTime: STALE_MS,
      }
    }),
  )
  const byId = computed(
    () => new Map((query.data.value?.departments ?? []).map((d) => [d.department_id, d])),
  )
  return { query, byId }
}

/**
 * `myDepartments` satırlarından seçili programın departmanları (Koordinatör/Üye seçim listesi;
 * `istemci-akislari` §2). Standing ile AYNI anahtar ve okuyucu (`['me','departments']`).
 */
export function useMyProgramDepartments() {
  const store = useScopeStore()
  const query = useQuery({
    queryKey: queryKeys.me.departments(),
    queryFn: fetchMyDepartments,
    retry: retryTransient,
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  })
  const departments = computed(() => {
    const seen = new Map<string, string>()
    for (const row of query.data.value?.data.departments ?? []) {
      if (row.program_id === store.programId && !seen.has(row.department_id)) {
        seen.set(row.department_id, row.display_name)
      }
    }
    return [...seen].map(([departmentId, displayName]) => ({ departmentId, displayName }))
  })
  return { query, departments }
}
