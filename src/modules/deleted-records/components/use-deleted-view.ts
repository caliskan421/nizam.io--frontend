/**
 * Silinen kayıtlar sayfasının görünüm mantığı: URL ⇄ süzgeçler, istemci süzgeci, aralık için
 * otomatik sayfa yükleme (en çok 5 ardışık sayfa, sonra elle "Daha fazla yükle"; mekanizma §4) ve
 * seçili kayıt. Sayfa bileşeni yalnız çizer (250 satır kapısı).
 */
import { computed, ref, watch, type ComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

import {
  applyFilters,
  changeKind,
  clearFilters,
  countLabel,
  filtersToQuery,
  isFiltered,
  parseFilters,
  rangeNeedsMore,
  type DeletedFilters,
} from '../model/filters'
import { DELETED_RECORDS_QUERY_KEYS } from '../routes'
import { useDeletedList } from './use-deleted-list'
import type { DeletedKind } from '../model/kinds'

/** Aralık için ardışık otomatik sayfa tavanı. */
export const MAX_AUTO_PAGES = 5

/**
 * Aralık: eşik aşılana ya da imleç bitene kadar sayfa yükle (aynı uç); tavan sonrası elle
 * "Daha fazla yükle". Kapsam ve oturum değişiminde sayaç sıfırlanır.
 */
function useRangePages(
  list: ReturnType<typeof useDeletedList>,
  filters: ComputedRef<DeletedFilters>,
  context: ComputedRef<{ now: Date; timezone: string }>,
) {
  const scope = useScopeStore()
  let autoPages = 0
  const resetAuto = () => {
    autoPages = 0
  }
  watch(() => [filters.value.kind, filters.value.range], resetAuto)
  const stopScope = scope.onChange(resetAuto)
  const stopSession = authSession.subscribe(resetAuto)
  const needsMore = computed(() =>
    rangeNeedsMore(list.rows.value, filters.value, list.hasMore.value, context.value),
  )
  const autoLoading = computed(
    () => needsMore.value && !list.moreFailed.value && autoPages < MAX_AUTO_PAGES,
  )
  watch(
    () => [needsMore.value, list.loadingMore.value, list.loading.value, list.rows.value.length],
    () => {
      if (!autoLoading.value || list.loadingMore.value || list.loading.value) return
      autoPages += 1
      void list.fetchMore()
    },
    { immediate: true },
  )
  return {
    autoLoading,
    dispose: () => {
      stopScope()
      stopSession()
    },
  }
}

export function useDeletedView(enabled: () => boolean) {
  const route = useRoute()
  const router = useRouter()
  const filters = computed(() => parseFilters(route.query))
  const list = useDeletedList(() => filters.value.kind, enabled)
  const now = ref(new Date())
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
  const setKind = (kind: DeletedKind) => navigate(changeKind(filters.value, kind))
  const clear = () => navigate(clearFilters(filters.value))

  const context = computed(() => ({ now: now.value, timezone: list.timezone.value }))
  const visible = computed(() => applyFilters(list.rows.value, filters.value, context.value))
  const filtered = computed(() => isFiltered(filters.value))
  const selected = computed(
    () => list.rows.value.find((row) => row.id === filters.value.selected) ?? null,
  )
  const count = computed(() =>
    list.loading.value || list.error.value
      ? null
      : countLabel(list.rows.value.length, list.hasMore.value),
  )

  const auto = useRangePages(list, filters, context)

  return {
    filters,
    list,
    visible,
    filtered,
    selected,
    count,
    now,
    autoLoading: auto.autoLoading,
    update,
    setKind,
    clear,
    dispose: auto.dispose,
  }
}
