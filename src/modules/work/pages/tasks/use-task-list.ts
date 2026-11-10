/**
 * Görev listesi verisi ve türetilmiş değerler (K3, 03 `backend.md` §4). Tek uç
 * `listProgramWorkItems`, tek `department_id` (Admin merceğinde koordinatörlük süzgeci, K/Ü
 * merceğinde seçili birim — `listDepartmentFilter`); departman başına istek yok (fan-out yasak).
 * Ad/kod sözlüğü `listProgramDepartments` (G13, bütün roller).
 *
 * Sunucu süzgeçleri (pin v0.15.0-api): `assignee_account_id` (BE-038) ve sayaç ucu
 * `countProgramWorkItems` (BE-003). Üye merceğinde atanan süzgeci "ben"dir (`lensAssignee`) ve
 * sunucuya gider; liste, sayaç, özet, sayfalayıcı ve boş durum AYNI süzgeçle okunur.
 *
 * Süzme sırası: talep (VE) → arama → sekme → sıralama. Arama ve talep sunucuda yok (BE-004):
 * yalnız bunlar açıkken sekme sayaçları yüklenen kümeden türetilir; aksi halde sekme sayaçları,
 * talep sayısı ve görev toplamı sunucu sayaçlarıdır (imleç tamlığından bağımsız kesin).
 * Sayaç ucu henüz yok/hatalıysa yüklenen kümeye düşülür ve "yüklenen kayıtlar içinde" der
 * (`complete` imleç bitince `true`, ortak-kurallar §10).
 */
import { computed, type Ref } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import { useProgramDepartments, useWorkItemCounts, useWorkItemList } from '../../api'
import {
  hasDateRequest,
  inTab,
  matchesSearch,
  requestDepartmentIds,
  sortItems,
} from '../../components/list/rows'
import { lensAssignee } from '../../model/assignment'
import { listDepartmentFilter } from '../../model/target'
import type { WorkItem } from '../../model/types'
import type { TasksUrlState } from './url-state'
import { useTaskCounts } from './use-task-counts'

export function useTaskList(state: Ref<TasksUrlState>, showRequests: Ref<boolean>) {
  const store = useScopeStore()
  const { standing } = useStanding()
  const department = computed(() => listDepartmentFilter(store.snapshot, state.value.department))
  /** Sunucu atanan süzgeci: Üye merceğinde yalnız "ben" (BE-038). */
  const assignee = computed(() => lensAssignee(store.lens, standing.value?.accountId))
  const assigneeIds = computed(() => (assignee.value === null ? [] : [assignee.value]))
  /** Üye merceğinde hesap kimliği bilinmeden süzgeçsiz (başkalarının satırlarını da içeren) okuma yok. */
  const ready = computed(() => store.lens !== 'member' || assignee.value !== null)
  const list = useWorkItemList(department, assigneeIds, ready)
  const countsQuery = useWorkItemCounts(department, assigneeIds, ready)
  const departments = useProgramDepartments()
  const byId = departments.byId

  const codeOf = (item: WorkItem) => byId.value.get(item.department_id)?.code ?? null
  const requestsOn = computed(() => showRequests.value && state.value.requests)

  /** Sunucunun süzdüğü yüklenen satırlar (Üye merceğinde zaten yalnız bana atananlar). */
  const items = list.items
  const serverCounts = computed(() => countsQuery.data.value ?? null)

  const base = computed(() =>
    items.value.filter(
      (item) =>
        (!requestsOn.value || hasDateRequest(item)) &&
        matchesSearch(item, state.value.search, codeOf(item)),
    ),
  )
  const counting = useTaskCounts({
    server: serverCounts,
    loaded: computed(() => list.query.data.value !== undefined),
    complete: list.complete,
    items,
    base,
    narrowed: computed(() => requestsOn.value || state.value.search.trim() !== ''),
    departmentCount: computed(() => (store.lens === 'admin' ? byId.value.size : 1)),
  })
  const rows = computed(() =>
    sortItems(
      base.value.filter((item) => inTab(item, state.value.tab)),
      state.value.sort,
    ),
  )

  const requestDepartments = computed(() =>
    requestDepartmentIds(items.value)
      .map((id) => byId.value.get(id)?.display_name)
      .filter((name): name is string => Boolean(name)),
  )

  return {
    query: list.query,
    items,
    complete: list.complete,
    departments,
    rows,
    ...counting,
    requestDepartments,
  }
}
