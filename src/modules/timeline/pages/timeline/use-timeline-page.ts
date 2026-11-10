/**
 * Sayfa modeli: Gantt yanıtı + URL durumu + departman adları → çerçevenin bütün türetilmiş
 * değerleri. Sayfa bileşeni yalnız bağlar (iskelet/rota testleri gövdeden bağımsız — KESİN 22).
 *
 *  - Sayaçlar, aralık, histogram YÜKLÜ yanıttan (süzgeçten bağımsız); tavan uyarısı süzgeçten
 *    bağımsız ham yanıt sayısına bakar (03c mekanizma §5).
 *  - Süzgeçler istemcide: durum + (yalnız Admin yüzünde) tek departman; kümede olmayan
 *    `departman` değeri yok sayılır (kenar menüsünden gelmeyen bağlantı, 08 E-08-86).
 *  - Seçili görev süzgeç dışına düşerse ya da yanıtta yoksa seçim URL'den düşer (panel kapanır).
 */
import { computed, watch, type ComputedRef } from 'vue'

import { useProgramDepartments } from '@/modules/work/public'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import type { GanttTask } from '../../model/types'
import { useGantt } from '../../api'
import { filterTasks, taskCounts, taskRange, weeklyHistogram } from './frame-model'
import { useTodayIso } from './today'
import { useTimelineUrl } from './use-timeline-url'
import { hasActiveFilters, type TimelineUrlState } from './url-state'

/** Etkin URL durumu: görünmeyen süzgeçler etkisiz (K/Ü yüzünde departman, kümede olmayan kimlik). */
function useEffectiveState(
  raw: ComputedRef<TimelineUrlState>,
  adminFace: ComputedRef<boolean>,
  departmentNames: ComputedRef<Map<string, string>>,
  departmentsLoaded: ComputedRef<boolean>,
): ComputedRef<TimelineUrlState> {
  return computed(() => {
    const value = raw.value
    const known = value.department !== null && departmentNames.value.has(value.department)
    const department =
      adminFace.value && (known || !departmentsLoaded.value) ? value.department : null
    return { ...value, department }
  })
}

/** Program departmanları: ad çözümü (E-03C-28) ve Admin süzgeç seçenekleri (E-03C-05). */
function useDepartmentLists() {
  const departments = useProgramDepartments()
  const list = computed(() => departments.query.data.value?.departments ?? [])
  return {
    departmentsLoaded: computed(() => departments.query.isSuccess.value),
    departmentNames: computed(
      () => new Map(list.value.map((d) => [d.department_id, d.display_name])),
    ),
    departmentCodes: computed(
      () =>
        new Map(
          list.value.flatMap((d) =>
            d.code ? [[d.department_id, d.code] as [string, string]] : [],
          ),
        ),
    ),
    departmentOptions: computed(() =>
      list.value.map((d) => ({ departmentId: d.department_id, displayName: d.display_name })),
    ),
  }
}

export function useTimelinePage(onReset: () => void) {
  const store = useScopeStore()
  const { standing, programs } = useStanding()
  const gantt = useGantt()
  const url = useTimelineUrl(onReset)

  const face = gantt.face
  const adminFace = computed(() => face.value === 'admin')
  const allTasks = gantt.tasks
  const ready = computed(() => gantt.query.isSuccess.value)

  const { departmentNames, departmentCodes, departmentOptions, departmentsLoaded } =
    useDepartmentLists()

  const state = useEffectiveState(url.state, adminFace, departmentNames, departmentsLoaded)
  const tasks = computed(() =>
    filterTasks(allTasks.value, state.value.status, state.value.department),
  )
  const range = computed(() => taskRange(allTasks.value))
  const selected = computed<GanttTask | null>(() => {
    const id = state.value.selected
    return id === null ? null : (tasks.value.find((t) => t.work_item_id === id) ?? null)
  })

  // Seçili görev yanıtta yok ya da süzgeç dışında: seçim düşer (panel kapanır).
  watch(
    () => [ready.value, state.value.selected, selected.value] as const,
    ([isReady, id, task]) => {
      if (isReady && id !== null && task === null) void url.update({ selected: null })
    },
    { immediate: true },
  )

  return {
    store,
    standing,
    gantt,
    url,
    state,
    face,
    adminFace,
    ready,
    tasks,
    allTasks,
    range,
    selected,
    departmentNames,
    departmentCodes,
    departmentOptions,
    today: useTodayIso(),
    counts: computed(() => taskCounts(allTasks.value)),
    histogram: computed(() => weeklyHistogram(allTasks.value, range.value)),
    filtered: computed(() => hasActiveFilters(state.value)),
    year: computed(
      () => programs.value?.find((p) => p.programId === store.programId)?.year ?? null,
    ),
  }
}
