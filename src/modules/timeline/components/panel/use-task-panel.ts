/**
 * Seçili görev panelinin veri ve yetki katmanı (E-03C-42, 54…66). Panel açılışında TAZE
 * `getWorkItem` (görevin KENDİ kapsamıyla; `dates_revision` ve `pending_date_request` yalnız
 * buradan gelir — `GanttTask` taşımaz) ve `listWorkItemFiles` (03 ile ortak anahtar; 403 → "—")
 * okunur; ek anahtar yoktur. Görünürlük yalnız `model/capabilities.ts`'ten (P1/P8/P18): yüz +
 * `company_admin`/koordinatör olguları; mercek yetki vermez.
 */
import { computed, ref, watch, type ComputedRef } from 'vue'

import {
  useProgramDepartments,
  useWorkItem,
  useWorkItemFiles,
  type WorkItem,
} from '@/modules/work/public'
import { workShortCode } from '@/modules/work/public'
import { toApiError } from '@/shared/errors/api-error'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import {
  canManageDependencies,
  canRequestDateChange,
  canReviewDateRequest,
  canSeeDateRequest,
  datePolicy,
  timelineActorFacts,
  type TimelineActorFacts,
} from '../../model/capabilities'
import { plannedEnd } from '../../model/dates'
import type { GanttFace, GanttTask } from '../../model/types'
import { formatInputDay } from './date-input'

interface PanelInput {
  task: GanttTask
  face: GanttFace
  departmentName: string | null
}

type DateSource = Pick<WorkItem, 'start_on' | 'end_on'> & { planned_end_on?: string }

/** Çubuğun/panelin bitişi: `planned_end_on` boş/yoksa `end_on`. */
export function plannedEndOf(source: DateSource): string {
  return plannedEnd({ planned_end_on: source.planned_end_on ?? '', end_on: source.end_on })
}

/**
 * Eylem görünürlüğü. Bekleyen talep bilinmiyorsa (görev henüz okunmadı) talep/onay/kaydet
 * eylemi çizilmez (en dar davranış); düzenleme yetkisi (`edit`) yüz + olgudan, görevden bağımsız.
 */
function useCapabilities(
  facts: ComputedRef<TimelineActorFacts>,
  item: ComputedRef<WorkItem | null>,
) {
  const pending = computed(() => item.value?.pending_date_request ?? null)
  const ctx = computed(() => ({ ...facts.value, pendingDateRequest: pending.value !== null }))
  const policy = computed(() => datePolicy(facts.value))
  const loaded = computed(() => item.value !== null)
  const can = computed(() => ({
    edit: policy.value !== 'none',
    save: loaded.value && policy.value === 'direct',
    request: loaded.value && canRequestDateChange(ctx.value),
    review: loaded.value && canReviewDateRequest(ctx.value),
    seePending: canSeeDateRequest(ctx.value),
    manage: canManageDependencies(ctx.value),
  }))
  return { policy, can }
}

/**
 * Tarih girdileri: taze görev gelince (ya da görev değişince) tohumlanır; kullanıcı düzenlediyse
 * (`dirty`) arka planda gelen yenileme girdiyi ezmez.
 */
function useDateDrafts(task: ComputedRef<GanttTask>, item: ComputedRef<WorkItem | null>) {
  const start = ref('')
  const end = ref('')
  const dirty = ref(false)
  function seed(): void {
    const source: DateSource = item.value ?? task.value
    start.value = formatInputDay(source.start_on)
    end.value = formatInputDay(source.end_on)
  }
  watch(
    () => task.value.work_item_id,
    () => (dirty.value = false),
  )
  watch(
    () => [
      task.value.work_item_id,
      item.value?.start_on,
      item.value?.end_on,
      item.value?.planned_end_on,
      task.value.start_on,
      task.value.end_on,
      task.value.planned_end_on,
    ],
    () => {
      if (!dirty.value) seed()
    },
    { immediate: true },
  )
  return { start, end, dirty, seed }
}

export function useTaskPanel(input: () => PanelInput) {
  const store = useScopeStore()
  const { standing } = useStanding()
  const departments = useProgramDepartments()
  const task = computed(() => input().task)
  const target = computed(() => ({
    programId: task.value.program_id,
    departmentId: task.value.department_id,
  }))
  const id = computed(() => task.value.work_item_id)

  const itemQuery = useWorkItem(id, target)
  const filesQuery = useWorkItemFiles(id, target)
  const item = computed(() => itemQuery.data.value ?? null)
  const facts = computed(() =>
    timelineActorFacts(standing.value, store.snapshot, input().face, task.value.department_id),
  )
  const { policy, can } = useCapabilities(facts, item)

  const kicker = computed(() => {
    const department = departments.byId.value.get(task.value.department_id)
    const parts: string[] = []
    // Kod yalnız Admin yüzünde (E-03C-30); sıra numarası yok → statik "—" (BE-005).
    if (input().face === 'admin' && department?.code) {
      parts.push(workShortCode(department.code))
    }
    const name = input().departmentName ?? department?.display_name
    if (name) parts.push(name)
    return parts.join(' · ')
  })
  const error = computed(() => {
    const raw = itemQuery.error.value
    return raw && !item.value ? toApiError(raw) : null
  })

  // Girdi ve Kaydet tek kaynaktan (`end_on`); `planned_end_on` yalnız salt okunur bilgi (ilk plan).
  const plannedNote = computed(() => {
    const source: DateSource = item.value ?? task.value
    const planned = source.planned_end_on ?? ''
    return planned !== '' && planned !== source.end_on ? formatInputDay(planned) : null
  })

  return {
    task,
    target,
    item,
    plannedNote,
    files: computed(() => filesQuery.data.value?.files.length ?? null),
    error,
    policy,
    can,
    kicker,
    ...useDateDrafts(task, item),
    retry: () => void itemQuery.refetch(),
    scope: () => store.snapshot,
  }
}

export type TaskPanel = ReturnType<typeof useTaskPanel>
