/**
 * Açılmış TEK satırın alt görev okuması (E-03C-33). Yalnız `open` iken `listWorkItemSubtasks`
 * (work `public.ts`; anahtar `workItems.subtasks`, 03 ile ortak) istenir; kapalı satırda istek
 * YOKTUR (K3: görev başına okuma fan-out olmaz). Aynı satırın açma düğmesi, ilerleme çizgisi,
 * sayaç çipi ve satırları AYNI anahtarı paylaşır → açılışta tek istek. Okuyucu `sessionBound`
 * + `signal` ile work katmanındadır (KESİN 26b).
 */
import { computed } from 'vue'

import { useWorkItemSubtasks, type WorkTarget } from '@/modules/work/public'

import { countSubtasks, type SubtaskCounts, type WorkItemSubtask } from './subtask-format'

export interface SubtaskSource {
  workItemId: string
  target: WorkTarget
  open: boolean
  /** Gantt satırı `subtask_counts` (BE-051): liste yüklenene dek ve kapalı satırda sayaç kaynağı. */
  rowCounts?: SubtaskCounts | null
}

const NONE: readonly WorkItemSubtask[] = []

export function useSubtaskSummary(source: () => SubtaskSource) {
  const query = useWorkItemSubtasks(
    () => (source().open ? source().workItemId : null),
    () => (source().open ? source().target : null),
  )
  const subtasks = computed<readonly WorkItemSubtask[]>(() =>
    source().open ? (query.data.value?.subtasks ?? NONE) : NONE,
  )
  /**
   * Açıkken yüklenmiş liste canlı sayaç verir; liste yokken satırın `subtask_counts`'ı (alt
   * görevi yoksa yok). Hiçbiri yoksa `null`: sayaç/çizgi/çip uydurulmaz (§4).
   */
  const counts = computed<SubtaskCounts | null>(() => {
    if (source().open && query.data.value !== undefined) return countSubtasks(subtasks.value)
    const row = source().rowCounts
    return row && row.total > 0 ? row : null
  })
  return { query, subtasks, counts }
}
