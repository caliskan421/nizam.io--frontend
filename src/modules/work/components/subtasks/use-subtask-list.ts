/**
 * Alt görev listesi + eylem görünürlüğü (E-03-21, E-03-30…37, E-03-60).
 *
 *  - Satır içi blok ve panel sekmesi AYNI sorguyu okur: `useWorkItemSubtasks` (anahtar
 *    `queryKeys.workItems.subtasks`, ortak-kurallar §6); istek görevin kendi kapsamıyla
 *    (`targetOf`). Blok açılınca yalnız o görev için okunur (§9: tek kayıt okuması).
 *  - Sayaç liste yüklenene dek satırdaki `subtask_counts`'tan (ek istek yok), sonra listeden.
 *  - Görünürlük yalnız `capabilities.ts` (s.146 yönet, s.147 kapat/aç); mercek girdi değil (P1).
 */
import { computed } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import { useWorkItemSubtasks } from '../../api'
import {
  canManageSubtasks,
  canToggleSubtask,
  subtaskAssigneeFact,
  workActorFacts,
} from '../../model/capabilities'
import { targetOf } from '../../model/target'
import type { WorkItem, WorkItemSubtask } from '../../model/types'
import { countSubtasks, type SubtaskCounts } from './subtask-format'

export function useSubtaskList(item: () => WorkItem) {
  const scope = useScopeStore()
  const { standing } = useStanding()
  const target = computed(() => targetOf(item()))
  const query = useWorkItemSubtasks(() => item().work_item_id, target)

  const subtasks = computed<readonly WorkItemSubtask[]>(() => query.data.value?.subtasks ?? [])
  const loaded = computed(() => query.data.value !== undefined)
  const counts = computed<SubtaskCounts>(() =>
    loaded.value ? countSubtasks(subtasks.value) : item().subtask_counts,
  )

  const facts = computed(() => workActorFacts(standing.value, scope.programId, item()))
  const canManage = computed(() => canManageSubtasks(facts.value))

  function canToggle(subtask: WorkItemSubtask): boolean {
    return canToggleSubtask({
      ...facts.value,
      subtaskAssignee: subtaskAssigneeFact(standing.value, subtask.assignee_account_id),
    })
  }

  return { query, target, subtasks, loaded, counts, canManage, canToggle }
}
