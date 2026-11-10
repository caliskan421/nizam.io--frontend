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
  /** Liste yüklenene dek `null`: sayaç/çizgi/çip uydurulmaz (§4). */
  const counts = computed<SubtaskCounts | null>(() =>
    source().open && query.data.value !== undefined ? countSubtasks(subtasks.value) : null,
  )
  return { query, subtasks, counts }
}
