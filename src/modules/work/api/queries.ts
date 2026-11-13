/**
 * Görev okuma composable'ları (TanStack Query). Anahtarlar YALNIZ `shared/http/query-keys.ts`
 * fabrikasından (ortak-kurallar §6, CX-T-01) ve seçili kapsamın anlık görüntüsüyle kurulur:
 * kapsam değişince hepsi düşer (K2). İstek başlıkları anahtarla aynı anlık görüntüden (liste)
 * ya da görevin kendi kapsamından (ayrıntı uçları) gelir.
 *
 * Yetki kaybı (403/404 K6 kodları) sorgu hatası olarak kapsam yaşam döngüsünce dinlenir.
 * Okuyucular oturuma bağlıdır (`sessionBound`, CX-F1-Ö-08): başka oturumda başlamış sorgunun
 * tekrarı gönderilmez, geç yanıtı önbelleğe yazılmaz.
 */
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type QueryFunctionContext,
  type QueryKey,
} from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import { fetchMyDepartments } from '@/shared/scope/standing'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import { listDepartmentFilter, locatedItems, resolveTarget } from '../model/target'
import type { WorkItem, WorkItemList, WorkItemResource, WorkTarget } from '../model/types'
import {
  fetchFiles,
  fetchNotes,
  fetchSubtasks,
  fetchWorkItem,
  fetchWorkItemCounts,
  fetchWorkItemPage,
  normalizeAssignees,
} from './fetchers'
import { retryTransient } from './http'

const STALE_MS = 30_000

/** Liste/sayaç süzgeç nesnesi: boş atanan listesi anahtara girmez (süzgeçsiz anahtar sabit kalır). */
function filterKey(departmentId: string | null, assigneeIds: readonly string[] | undefined) {
  const assignees = normalizeAssignees(assigneeIds)
  return { department: departmentId, ...(assignees.length > 0 ? { assignees } : {}) }
}

/** Liste sorgusunun seçenekleri: `useWorkItemList` ve `useWorkItemTarget` AYNI anahtarı paylaşır. */
function listOptions(
  scope: ScopeSnapshot,
  departmentId: string | null,
  assigneeIds: readonly string[] | undefined,
  fetchEnabled: boolean,
) {
  const programId = scope.programId
  const assignees = normalizeAssignees(assigneeIds)
  return {
    queryKey: queryKeys.workItems.list(scope, filterKey(departmentId, assignees)),
    queryFn: sessionBound(
      ({ pageParam, signal }: QueryFunctionContext<QueryKey, string | undefined>) =>
        fetchWorkItemPage(
          { programId: programId ?? '' },
          departmentId,
          pageParam,
          signal,
          assignees,
        ),
    ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: WorkItemList) => last.next_cursor || undefined,
    enabled: fetchEnabled && programId !== null,
    retry: retryTransient,
    staleTime: STALE_MS,
  }
}

/**
 * Görev listesi — `listProgramWorkItems` imleçli sonsuz sorgu (`limit` 200). `department` tek
 * değerdir (`listDepartmentFilter`; K3). `assignees` sunucu atanan süzgecidir
 * (`assignee_account_id`, çoklu, VEYA; BE-038): Üye merceğinde "ben", kişi süzgecinde seçilenler.
 * "Daha fazla yükle" = `fetchNextPage()` (aynı uç, aynı süzgeç; fan-out değil, §9). `complete`
 * imleç bittiğinde `true`: yüklenen kümenin tam olduğu anlamına gelir (satır düzeyi süzgeç ve
 * arama sayaçları için); kesin toplam/sayaçlar `useWorkItemCounts`'tadır. İmleç URL'de
 * taşınmaz. `enabled` kapalıyken istek yok (süzgeç girdisi — ör. Üye merceğinde hesap kimliği —
 * henüz bilinmiyorsa süzgeçsiz istek atılmaz).
 */
export function useWorkItemList(
  department: MaybeRefOrGetter<string | null>,
  assignees?: MaybeRefOrGetter<readonly string[] | undefined>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const store = useScopeStore()
  const query = useInfiniteQuery(
    computed(() =>
      listOptions(store.snapshot, toValue(department), toValue(assignees), toValue(enabled)),
    ),
  )
  const items = computed<WorkItem[]>(
    () => query.data.value?.pages.flatMap((page) => page.items) ?? [],
  )
  const complete = computed(
    () => query.data.value !== undefined && query.hasNextPage.value === false,
  )
  return { query, items, complete }
}

/**
 * `countProgramWorkItems` — görünür görev sayaçları (BE-003). Süzgeçler listeyle aynıdır
 * (`department_id`, `assignee_account_id`); görünürlük sunucuda. Okuyucu `sessionBound` ve
 * `signal` iletir (Ö-08). `enabled` kapalıyken istek yok.
 */
export function useWorkItemCounts(
  department: MaybeRefOrGetter<string | null>,
  assignees?: MaybeRefOrGetter<readonly string[] | undefined>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const departmentId = toValue(department)
      const assigneeIds = normalizeAssignees(toValue(assignees))
      return {
        queryKey: queryKeys.workItems.counts(scope, filterKey(departmentId, assigneeIds)),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchWorkItemCounts(
            { programId: scope.programId ?? '' },
            departmentId,
            assigneeIds,
            signal,
          ),
        ),
        enabled: toValue(enabled) && scope.programId !== null,
        retry: retryTransient,
        staleTime: STALE_MS,
      }
    }),
  )
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
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetcher(resolved ?? { programId: '', departmentId: '' }, id ?? '', signal),
        ),
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
 * Yalnız kimlik bilinirken (derin bağlantı `?gorev=`) hedef: liste sorgusundaki satır → görevin
 * kendi kapsamı; yoksa K/Ü merceğinde seçili birim; Admin merceğinde `null`.
 *
 * Liste verisine REAKTİFTİR: aynı anahtarla, kendisi istek atmayan (`enabled: false`) bir
 * gözlemci kurulur; liste sonradan yüklenince (ya da "daha fazla yükle" ile satır gelince) hedef
 * yeniden hesaplanır, kapsam değişince anahtar değişir ve sıfırlanır. `listDepartment` listenin
 * kullandığı `department_id`'dir; verilmezse `listDepartmentFilter(kapsam, null)` (Admin'de
 * süzgeçsiz liste, K/Ü'de seçili birim). Admin koordinatörlük süzgeci açıksa çağıran onu verir.
 */
export function useWorkItemTarget(
  workItemId: MaybeRefOrGetter<string | null>,
  listDepartment?: MaybeRefOrGetter<string | null | undefined>,
  listAssignees?: MaybeRefOrGetter<readonly string[] | undefined>,
) {
  const store = useScopeStore()
  const client = useQueryClient()
  const list = useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const department = toValue(listDepartment) ?? listDepartmentFilter(scope, null)
      return listOptions(scope, department, toValue(listAssignees), false)
    }),
  )
  return computed<WorkTarget | null>(() => {
    const id = toValue(workItemId)
    if (id === null) return null
    const listed = list.data.value?.pages.flatMap((page) => page.items) ?? []
    // Bu ekranın listesinde yoksa seçili kapsamda önbelleğe düşmüş başka listelerden (K1/Ü1 kuyruğu)
    // görevin kendi birimi alınır; hiçbirinde yoksa seçili birim (derin bağlantı).
    const cached = client
      .getQueriesData({ queryKey: queryKeys.workItems.all(store.snapshot) })
      .flatMap(([, data]) => locatedItems(data))
    return resolveTarget(id, store.snapshot, [...listed, ...cached])
  })
}

/** `listProgramDepartments` okuyucusu shared'dadır (modül döngüsü; W142 KUSUR 4); adı korunur. */
export { useProgramDepartments } from '@/shared/scope/program-departments'

/**
 * `myDepartments` satırlarından seçili programın departmanları (Koordinatör/Üye seçim listesi;
 * `istemci-akislari` §2). Standing ile AYNI anahtar ve okuyucu (`['me','departments']`).
 */
export function useMyProgramDepartments() {
  const store = useScopeStore()
  const query = useQuery({
    queryKey: queryKeys.me.departments(),
    queryFn: sessionBound(fetchMyDepartments),
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
