/**
 * Görev listesi verisi ve türetilmiş değerler (K3, 03 `backend.md` §4). Tek uç
 * `listProgramWorkItems`, tek `department_id` (Admin merceğinde koordinatörlük süzgeci, K/Ü
 * merceğinde seçili birim — `listDepartmentFilter`); departman başına istek yok (fan-out yasak).
 * Ad/kod sözlüğü `listProgramDepartments` (G13, bütün roller).
 *
 * Süzme sırası: talep (VE) → arama → sekme → sıralama. Sekme sayaçları talep + arama süzülmüş
 * küme üzerinde (sekme kendi sayacını süzmez); talep sayısı yüklenen kümenin tamamında. Hepsi
 * yüklenen kayıtlar içindedir; `complete` imleç bitince `true` (ortak-kurallar §10, P4).
 *
 * Üye merceği (K3, CX-F1-E-01): pinli uçta atanan süzgeci yok → temel küme yüklenen satırlarda
 * "bana atananlar"a daraltılır (`assignedSubset`, tek yüklem `model/assignment.ts`). Sekme
 * sayaçları, talep sayısı, özet, sayfalayıcı ve boş durum HEP bu daraltılmış kümeden
 * (`items`) hesaplanır; imleç bitmediyse "yüklenen kayıtlar içinde" etiketi aynen geçerli.
 * Mercek yetki değildir: derin bağlantıyla açılan atanmamış görevin paneli değişmez (yetki
 * sunucuda); yalnız liste kümesi daralır.
 */
import { computed, type Ref } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import { useProgramDepartments, useWorkItemList } from '../../api'
import {
  hasDateRequest,
  inTab,
  matchesSearch,
  requestDepartmentIds,
  sortItems,
  tabCounts,
  uniqueAssigneeCount,
} from '../../components/list/rows'
import { assignedSubset, lensAssignee } from '../../model/assignment'
import { listDepartmentFilter } from '../../model/target'
import type { WorkItem } from '../../model/types'
import type { TasksUrlState } from './url-state'

export function useTaskList(state: Ref<TasksUrlState>, showRequests: Ref<boolean>) {
  const store = useScopeStore()
  const { standing } = useStanding()
  const department = computed(() => listDepartmentFilter(store.snapshot, state.value.department))
  const list = useWorkItemList(department)
  const departments = useProgramDepartments()
  const byId = departments.byId

  const codeOf = (item: WorkItem) => byId.value.get(item.department_id)?.code ?? null
  const requestsOn = computed(() => showRequests.value && state.value.requests)

  /** Mercek kümesi: Üye merceğinde yalnız bana atananlar; diğer merceklerde yüklenen satırlar. */
  const assignee = computed(() => lensAssignee(store.lens, standing.value?.accountId))
  const items = computed(() => assignedSubset(list.items.value, assignee.value))

  const base = computed(() =>
    items.value.filter(
      (item) =>
        (!requestsOn.value || hasDateRequest(item)) &&
        matchesSearch(item, state.value.search, codeOf(item)),
    ),
  )
  /** Sekme sayaçları; veri yokken (ilk yükleme sürüyor / hata) `null` — "(0)" yazılmaz. */
  const counts = computed(() =>
    list.query.data.value === undefined ? null : tabCounts(base.value),
  )
  const rows = computed(() =>
    sortItems(
      base.value.filter((item) => inTab(item, state.value.tab)),
      state.value.sort,
    ),
  )

  const requestCount = computed(() => items.value.filter(hasDateRequest).length)
  const requestDepartments = computed(() =>
    requestDepartmentIds(items.value)
      .map((id) => byId.value.get(id)?.display_name)
      .filter((name): name is string => Boolean(name)),
  )

  /**
   * E-03-04: görev = yüklenen satır, koordinatörlük = süzgeç seçenek sayısı, kişi = tekil atanan.
   * Veri yokken (ilk yükleme sürüyor / hata) `null` — sayı yazılmaz.
   */
  const summary = computed(() =>
    list.query.data.value === undefined
      ? null
      : {
          tasks: items.value.length,
          departments: store.lens === 'admin' ? byId.value.size : 1,
          people: uniqueAssigneeCount(items.value),
        },
  )

  return {
    query: list.query,
    items,
    complete: list.complete,
    departments,
    rows,
    counts,
    requestCount,
    requestDepartments,
    summary,
  }
}
