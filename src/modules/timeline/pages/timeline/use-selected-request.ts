/**
 * Seçili görevin bekleyen tarih talebi → çubuk uzantısı (03c E-03C-42). Veri, panelin zaten
 * okuduğu taze `getWorkItem`'dan gelir (AYNI sorgu anahtarı: ek istek yok); seçim yoksa istek de
 * yoktur. Görünürlük `canSeeDateRequest`: Admin her görevde, Koordinatör kendi biriminde, Üye hiç.
 */
import { computed, type ComputedRef } from 'vue'

import { useWorkItem } from '@/modules/work/public'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import type { GanttDateRequest } from '../../components'
import { canSeeDateRequest, timelineActorFacts } from '../../model/capabilities'
import type { GanttFace, GanttTask } from '../../model/types'

export function useSelectedDateRequest(
  task: ComputedRef<GanttTask | null>,
  face: ComputedRef<GanttFace | null>,
): ComputedRef<GanttDateRequest | null> {
  const store = useScopeStore()
  const { standing } = useStanding()
  const item = useWorkItem(
    () => task.value?.work_item_id ?? null,
    () =>
      task.value
        ? { programId: task.value.program_id, departmentId: task.value.department_id }
        : null,
  )
  return computed(() => {
    const current = task.value
    const pending = item.data.value?.pending_date_request ?? null
    if (!current || !face.value || !pending) return null
    if (item.data.value?.work_item_id !== current.work_item_id) return null
    const facts = timelineActorFacts(
      standing.value,
      store.snapshot,
      face.value,
      current.department_id,
    )
    if (!canSeeDateRequest(facts)) return null
    return {
      workItemId: current.work_item_id,
      newStartOn: pending.new_start_on,
      newEndOn: pending.new_end_on,
    }
  })
}
