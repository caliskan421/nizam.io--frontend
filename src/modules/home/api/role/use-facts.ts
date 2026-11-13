/**
 * K1/Ü1 satır yetkileri (P1: mercek değil olgu): görevin KENDİ departmanı için olgular
 * `workActorFacts` ile (`work/model/capabilities.ts`, K1). Yetkisiz eylem DOM'da yok.
 */
import { computed } from 'vue'

import {
  transitionTargets,
  WORK_CAPABILITIES,
  workActorFacts,
  type WorkItem,
  type WorkItemStatus,
} from '@/modules/work/public'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

export function useRoleFacts() {
  const store = useScopeStore()
  const { standing } = useStanding()
  const me = computed(() => standing.value?.accountId ?? null)
  const factsOf = (item: WorkItem) => workActorFacts(standing.value, store.programId, item)
  return {
    me,
    standing,
    /** Bu görevde seçili geçiş hedefi aktörün matrisinde var mı (§5). */
    canMove: (item: WorkItem, to: WorkItemStatus) =>
      WORK_CAPABILITIES.transition(factsOf(item)) &&
      transitionTargets(factsOf(item), item.status).includes(to),
    canOwnMove: (item: WorkItem, to: WorkItemStatus) =>
      WORK_CAPABILITIES.ownStatus(factsOf(item)) &&
      transitionTargets(factsOf(item), item.status).includes(to),
    canClaim: (item: WorkItem) => WORK_CAPABILITIES.manageAssignments(factsOf(item)),
    canAssign: (item: WorkItem) => WORK_CAPABILITIES.manageAssignments(factsOf(item)),
    canExtend: (item: WorkItem) =>
      WORK_CAPABILITIES.requestDateChange({
        ...factsOf(item),
        pendingDateRequest: item.pending_date_request !== null,
      }),
    canUpload: (item: WorkItem) => WORK_CAPABILITIES.uploadFile(factsOf(item)),
    canNote: (item: WorkItem) => WORK_CAPABILITIES.writeNote(factsOf(item)),
  }
}
