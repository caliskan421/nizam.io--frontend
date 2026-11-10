/**
 * Bağımlılık ekle / kaldır penceresinin mantığı (E-03C-37, 66; Admin + Koordinatör). Ön görev
 * adayları AÇIK Gantt yanıtından (aynı sorgu anahtarı, ek istek yok); mevcut ön görevler
 * `listDependencies`'ten (03 ile ortak anahtar; yalnız koordinatör/yönetici okur). Yazmalar
 * anahtarsız (K5): istek sürerken düğmeler kilitli, kör tekrar yok. Ekleme `addDependency`
 * (BAĞIMLI görevin kapsamıyla); 409 `work.dependency_cycle`/`_duplicate` satır içi gösterilir.
 * Başarıda Gantt + bağımlılık listesi veri katmanında (§6) yeniden okunur.
 */
import { computed, ref } from 'vue'

import { reachesOwner } from '@/shared/http/mutation'
import { notifyOutcome } from '@/shared/ui/confirm'
import { useToast } from '@/shared/ui'

import { useAddDependency, useDependencies, useGantt, useRemoveDependency } from '../../api'
import type { GanttTask } from '../../model/types'
import { panelText } from './messages'
import { failedFieldText } from './outcomes'

export interface DependencyRow {
  dependencyId: string
  title: string
}

/** Ön görev adayları ve mevcut ön görevler (ek istek yok: açık Gantt sorgusu + 03 ortak anahtar). */
function useDependencyData(task: () => GanttTask) {
  const gantt = useGantt()
  const target = computed(() => ({
    programId: task().program_id,
    departmentId: task().department_id,
  }))
  const query = useDependencies(() => task().work_item_id, target)
  const titles = computed(() => new Map(gantt.tasks.value.map((t) => [t.work_item_id, t.title])))
  const existing = computed(() => query.data.value?.dependencies ?? [])
  const rows = computed<DependencyRow[]>(() =>
    existing.value.map((edge) => ({
      dependencyId: edge.dependency_id,
      title: titles.value.get(edge.depends_on_work_item_id) ?? panelText('dependency.otherScope'),
    })),
  )
  const candidates = computed(() => {
    const taken = new Set(existing.value.map((edge) => edge.depends_on_work_item_id))
    return gantt.tasks.value
      .filter((t) => t.work_item_id !== task().work_item_id && !taken.has(t.work_item_id))
      .map((t) => ({ value: t.work_item_id, label: t.title }))
  })
  return { target, query, rows, candidates }
}

export function useDependencyDialog(task: () => GanttTask, close: () => void) {
  const toast = useToast()
  const data = useDependencyData(task)
  const add = useAddDependency()
  const remove = useRemoveDependency()
  const selected = ref('')
  const error = ref<string | null>(null)
  const busy = computed(() => add.isPending.value || remove.isPending.value)

  /** Başarısızlıkta satır içi kod metni; metni olmayan sınıflar ortak bildirimden gider. */
  function fail(outcome: Parameters<typeof failedFieldText>[0]): void {
    error.value = failedFieldText(outcome)
    if (error.value === null) notifyOutcome(outcome)
  }

  async function submitAdd(): Promise<void> {
    if (busy.value || selected.value === '') return
    error.value = null
    const outcome = await add.submit({
      target: { ...data.target.value },
      workItemId: task().work_item_id,
      dependsOnWorkItemId: selected.value,
    })
    if (!reachesOwner(outcome)) return
    if (outcome.kind !== 'success') return fail(outcome)
    toast.push({ message: panelText('done.dependencyAdded') })
    close()
  }

  async function submitRemove(row: DependencyRow): Promise<void> {
    if (busy.value) return
    error.value = null
    const outcome = await remove.submit({
      target: { ...data.target.value },
      workItemId: task().work_item_id,
      dependencyId: row.dependencyId,
    })
    if (!reachesOwner(outcome)) return
    if (outcome.kind !== 'success') return fail(outcome)
    toast.push({ message: panelText('done.dependencyRemoved') })
  }

  return {
    selected,
    error,
    rows: data.rows,
    candidates: data.candidates,
    busy,
    query: data.query,
    submitAdd,
    submitRemove,
  }
}
