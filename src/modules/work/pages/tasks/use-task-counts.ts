/**
 * Görev listesinin sayaç görünümü (03 E-03-04/07/08/13/38; BE-003, pin v0.15.0-api).
 *
 * Kaynak sırası: sunucu sayaçları (`countProgramWorkItems`; kesin, imleç tamlığından bağımsız) →
 * yüklenen küme (yedek). Sunucu sayaçları arama ve talep süzgecini bilmez (BE-004): yalnız bunlar
 * açıkken (`narrowed`) sekme sayaçları yüklenen kümeden türetilir, imleç bitmediyse kesin
 * değildir ("yüklenen kayıtlar içinde"). Bekleyen talep sayısı arama/sekmeden bağımsızdır, bu
 * yüzden her zaman sunucu değeridir. Veri yokken (ilk yükleme sürüyor / hata) sekme sayaçları ve
 * özet `null` — "(0)" ve sahte sayı yazılmaz.
 */
import { computed, type Ref } from 'vue'

import {
  countsFromServer,
  hasDateRequest,
  tabCounts,
  uniqueAssigneeCount,
} from '../../components/list/rows'
import type { WorkItem, WorkItemCounts } from '../../model/types'

interface Sources {
  /** `countProgramWorkItems` yanıtı; yok/hata/yükleniyor → `null`. */
  server: Ref<WorkItemCounts | null>
  /** Liste ilk sayfası geldi mi. */
  loaded: Ref<boolean>
  /** İmleç bitti (yüklenen küme tam). */
  complete: Ref<boolean>
  /** Sunucunun süzdüğü yüklenen satırlar. */
  items: Ref<readonly WorkItem[]>
  /** `items` ∩ arama ∩ talep (sekmeden önce). */
  base: Ref<readonly WorkItem[]>
  /** Arama ya da talep süzgeci açık. */
  narrowed: Ref<boolean>
  /** Koordinatörlük sayısı (Admin: süzgeç seçenekleri; K/Ü: 1). */
  departmentCount: Ref<number>
}

export function useTaskCounts(src: Sources) {
  const serverTabs = computed(() => src.server.value !== null && !src.narrowed.value)
  const counts = computed(() => {
    if (serverTabs.value && src.server.value) return countsFromServer(src.server.value)
    return src.loaded.value ? tabCounts(src.base.value) : null
  })
  /** Sekme sayaçları kesin mi: sunucudan ya da küme tam. */
  const countsExact = computed(() => serverTabs.value || src.complete.value)
  const requestCount = computed(
    () => src.server.value?.pending_date_requests ?? src.items.value.filter(hasDateRequest).length,
  )
  /** Görev toplamı (sunucu); sayaç yoksa `null` (sayfalayıcı "‹n› / ‹toplam›" kurmaz). */
  const total = computed(() => src.server.value?.total ?? null)
  const summary = computed(() => {
    if (!src.loaded.value && src.server.value === null) return null
    return {
      tasks: src.server.value?.total ?? src.items.value.length,
      tasksExact: src.server.value !== null || src.complete.value,
      departments: src.departmentCount.value,
      people: uniqueAssigneeCount(src.items.value),
      peopleExact: src.complete.value,
    }
  })
  return { counts, countsExact, requestCount, total, summary }
}
