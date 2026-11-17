import { computed, ref, watch, type Ref } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import { moveTargetDepartments, type MoveTargetDepartment } from '../../model/capabilities'
import type { UploadTask } from '../../model/types'
import { useSubtaskOptions } from '../upload/use-subtask-options'
import { useMoveTargets } from './use-move-targets'

/** Seçili görev, alt görev seçenekleri ve seçici seçenekleri (hedef departman = seçili görevin departmanı). */
function useMoveOptions(
  candidates: Readonly<Ref<readonly UploadTask[]>>,
  taskId: Readonly<Ref<string>>,
  departments: Readonly<Ref<readonly MoveTargetDepartment[]>>,
) {
  const store = useScopeStore()
  const selected = computed(() => candidates.value.find((t) => t.workItemId === taskId.value))
  const subtaskTarget = computed(() => {
    const task = selected.value
    return store.snapshot.programId !== null && task
      ? { programId: store.snapshot.programId, departmentId: task.departmentId }
      : null
  })
  const subtasks = useSubtaskOptions(() => selected.value?.workItemId ?? null, subtaskTarget)
  const taskOptions = computed(() =>
    candidates.value.map((t) => ({ value: t.workItemId, label: t.title })),
  )
  const departmentOptions = computed(() =>
    departments.value.map((d) => ({ value: d.departmentId, label: d.displayName })),
  )
  return { selected, subtasks, taskOptions, departmentOptions }
}

/** Varsayılan hedef departman: sırayla kaynak dosyanınki, global seçili, ilk yetkili; yoksa boş. */
function defaultMoveDepartment(
  departments: readonly MoveTargetDepartment[],
  preferred: readonly (string | null)[],
): string {
  const ids = departments.map((d) => d.departmentId)
  return preferred.find((id): id is string => id !== null && ids.includes(id)) ?? ids[0] ?? ''
}

/**
 * Taşıma penceresinin hedef seçimi (W194): hedef departman (yalnız yetkili birden çok departman
 * varsa gösterilir) → hedef görev → isteğe bağlı alt görev. Departman değişince görev ve alt görev,
 * görev değişince alt görev sıfırlanır; seçili görev yenilenen listeden düşerse `lost` olur.
 * Varsayılan departman: kaynak dosyanınki, yoksa global seçili, yoksa ilk yetkili. Global kapsam
 * deposuna yazılmaz.
 */
export function useMoveForm(open: () => boolean, sourceDepartmentId: () => string) {
  const store = useScopeStore()
  const { standing } = useStanding()
  const departments = computed(() =>
    moveTargetDepartments(standing.value, store.snapshot.programId),
  )
  const departmentId = ref('')
  const taskId = ref('')
  const subtaskId = ref('')
  const lost = ref(false)
  const targets = useMoveTargets(open, departments, departmentId)

  const { selected, subtasks, taskOptions, departmentOptions } = useMoveOptions(
    targets.candidates,
    taskId,
    departments,
  )

  const defaultDepartment = () =>
    defaultMoveDepartment(departments.value, [sourceDepartmentId(), store.snapshot.departmentId])
  function reset(): void {
    taskId.value = ''
    subtaskId.value = ''
    lost.value = false
    departmentId.value = defaultDepartment()
  }
  // Standing sonradan gelir ya da yetkili küme değişir: geçersiz departman seçimi sıfırlanır.
  watch(departments, (list) => {
    if (list.some((d) => d.departmentId === departmentId.value)) return
    taskId.value = ''
    departmentId.value = defaultDepartment()
  })
  watch(taskId, () => (subtaskId.value = ''))
  // Seçili hedef yenilenen listeden düştü (silindi/atama kalktı): seçim kaybolur, kullanıcı bilgilenir.
  watch(targets.candidates, (list) => {
    if (taskId.value !== '' && !list.some((t) => t.workItemId === taskId.value)) {
      taskId.value = ''
      lost.value = true
    }
  })

  function pickTask(value: string, department = departmentId.value): void {
    taskId.value = value
    lost.value = false
    departmentId.value = department
  }
  const pickDepartment = (value: string): void => pickTask('', value)
  return {
    targets,
    departmentId,
    departmentOptions,
    showDepartments: computed(() => departments.value.length > 1),
    taskId,
    subtaskId,
    lost,
    selected,
    subtasks,
    taskOptions,
    reset,
    pickDepartment,
    pickTask,
  }
}
