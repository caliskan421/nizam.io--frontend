/**
 * Silinen kayıtlar sayfasının görünüm mantığı: URL ⇄ süzgeçler, sıralama (bellekte), sunucu
 * sorgusu ve seçili kayıt. Süzgeç, arama, aralık ve sıra SUNUCUDA çalışır (BE-117): görünür
 * küme listenin kendisidir, istemci süzmez ve aralık için sayfa yüklemez. Sayfa bileşeni yalnız
 * çizer (250 satır kapısı).
 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  changeKind,
  clearFilters,
  DEFAULT_SORT,
  filtersToQuery,
  isFiltered,
  parseFilters,
  toggleSort,
  toListQuery,
  type DeletedFilters,
  type SortKey,
} from '../model/filters'
import type { DeletedKind } from '../model/kinds'
import { DELETED_RECORDS_QUERY_KEYS } from '../routes'
import { useFilterCandidates } from './use-filter-candidates'
import { useDeletedList, useDeletedTimezone } from './use-deleted-list'
import { useViewSelection } from './use-view-selection'

export function useDeletedView(enabled: () => boolean) {
  const route = useRoute()
  const router = useRouter()
  const filters = computed(() => parseFilters(route.query))
  const sort = ref(DEFAULT_SORT)
  const now = ref(new Date())
  const timezone = useDeletedTimezone()
  // Sorgu anahtarı gün anahtarından türer (`rangeFrom`): `now` saniyeler içinde değişse de aynı.
  const query = computed(() =>
    toListQuery(filters.value, sort.value, { now: now.value, timezone: timezone.value }),
  )
  const list = useDeletedList(() => filters.value.kind, query, enabled)
  watch(list.rows, () => {
    now.value = new Date()
  })

  function navigate(next: DeletedFilters): void {
    const keep = Object.fromEntries(
      Object.entries(route.query).filter(
        ([key]) => !(DELETED_RECORDS_QUERY_KEYS as readonly string[]).includes(key),
      ),
    )
    void router.replace({ query: { ...keep, ...filtersToQuery(next) } })
  }
  const update = (patch: Partial<DeletedFilters>) => navigate({ ...filters.value, ...patch })
  const setKind = (kind: DeletedKind) => {
    sort.value = DEFAULT_SORT
    navigate(changeKind(filters.value, kind))
  }
  const clear = () => navigate(clearFilters(filters.value))
  const setSort = (key: SortKey) => {
    sort.value = toggleSort(sort.value, key)
  }

  const { selected, select, openParent } = useViewSelection({
    filters,
    rows: () => list.rows.value,
    update,
    sort,
    navigate,
  })
  const candidates = useFilterCandidates(
    () => filters.value.kind,
    () => list.rows.value,
  )

  return {
    filters,
    query,
    list,
    sort,
    filtered: computed(() => isFiltered(filters.value)),
    selected,
    select,
    openParent,
    now,
    candidates,
    update,
    setKind,
    setSort,
    clear,
    dispose: candidates.dispose,
  }
}
