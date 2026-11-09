/**
 * Sayfa çerçevesi hesapları (saf): sayaçlar, istemci süzgeçleri, görev aralığı, haftalık
 * yoğunluk ve ölçek adımı. Hepsi YÜKLÜ Gantt yanıtından (ilk 200 kalem) türer; tavan
 * ayrıca `model/ceiling.ts` ile işaretlenir (E-03C-02, 15, 82).
 */
import type { GanttScale, GanttStatusFilter } from '../../components'
import { dayDiff, dayNumber, plannedEnd } from '../../model/dates'
import type { GanttTask } from '../../model/types'
import type { DayRange } from '../../components/frame/strip-model'

export const SCALES: readonly GanttScale[] = ['gun', 'hafta', 'ay']
export const STATUS_FILTERS: readonly GanttStatusFilter[] = ['tumu', 'acik', 'geciken', 'biten']

const DONE_STATUS = 'tamamlandi'

/** Biten: durum `tamamlandi`. */
export const isDone = (task: GanttTask): boolean => task.status === DONE_STATUS

/**
 * Geciken: `lateness.is_overdue` (istemcide; `overdue=true` parametresi kullanılmaz — GAP-053).
 * Tamamlanmış görev, geç bitmiş olsa da gecikmede sayılmaz.
 */
export const isOverdue = (task: GanttTask): boolean => !isDone(task) && task.lateness.is_overdue

export interface TaskCounts {
  total: number
  done: number
  overdue: number
}

export function taskCounts(tasks: readonly GanttTask[]): TaskCounts {
  let done = 0
  let overdue = 0
  for (const task of tasks) {
    if (isDone(task)) done += 1
    else if (isOverdue(task)) overdue += 1
  }
  return { total: tasks.length, done, overdue }
}

/** Durum süzgeci (E-03C-06): Açık = tamamlanmamış hepsi (ozellikler §7-8 varsayımı). */
export function matchesStatus(task: GanttTask, status: GanttStatusFilter): boolean {
  switch (status) {
    case 'acik':
      return !isDone(task)
    case 'geciken':
      return isOverdue(task)
    case 'biten':
      return isDone(task)
    default:
      return true
  }
}

/** Departman (yalnız Admin yüzü; `null` = tümü) ve durum süzgeçleri. */
export function filterTasks(
  tasks: readonly GanttTask[],
  status: GanttStatusFilter,
  departmentId: string | null,
): GanttTask[] {
  return tasks.filter(
    (task) =>
      (departmentId === null || task.department_id === departmentId) && matchesStatus(task, status),
  )
}

/** Görevin çizilen son günü: planlanan bitiş, bitiş ve (varsa) tamamlanma gününün en geçi. */
function lastDay(task: GanttTask): number | null {
  const days = [plannedEnd(task), task.end_on, task.completed_on]
    .map(dayNumber)
    .filter((n) => n !== null)
  return days.length === 0 ? null : Math.max(...days)
}

/** Görevin çizilen aralığı (başlangıç, son gün); tarihsiz ya da bozuk görev `null`. */
function spanOf(task: GanttTask): { first: number; last: number } | null {
  const first = dayNumber(task.start_on)
  const last = lastDay(task)
  return first === null || last === null || last < first ? null : { first, last }
}

const isoOf = (day: number): string => new Date(day * 86_400_000).toISOString().slice(0, 10)

/** Yüklü görevlerin en erken başlangıç – en geç bitişi (E-03C-14); tarihli görev yoksa `null`. */
export function taskRange(tasks: readonly GanttTask[]): DayRange | null {
  const spans = tasks.map(spanOf).filter((span) => span !== null)
  if (spans.length === 0) return null
  return {
    start: isoOf(Math.min(...spans.map((span) => span.first))),
    end: isoOf(Math.max(...spans.map((span) => span.last))),
  }
}

/** Haftalık (aralık başından 7'şer gün) çizilen görev sayısı (E-03C-15). */
export function weeklyHistogram(tasks: readonly GanttTask[], range: DayRange | null): number[] {
  if (range === null) return []
  const origin = dayNumber(range.start)
  const span = dayDiff(range.start, range.end)
  if (origin === null || span === null) return []
  const weeks = Math.ceil((span + 1) / 7)
  const counts: number[] = Array.from({ length: weeks }, () => 0)
  for (const task of tasks) {
    const drawn = spanOf(task)
    if (drawn === null) continue
    const from = Math.max(0, Math.floor((drawn.first - origin) / 7))
    const to = Math.min(weeks - 1, Math.floor((drawn.last - origin) / 7))
    for (let week = from; week <= to; week += 1) counts[week] = (counts[week] ?? 0) + 1
  }
  return counts
}

/** Uzaklaştır: gün → hafta → ay; en geniş ölçekte aynı kalır. */
export function zoomOut(scale: GanttScale): GanttScale {
  return SCALES[Math.min(SCALES.indexOf(scale) + 1, SCALES.length - 1)]!
}

/** Yakınlaştır: ay → hafta → gün; en dar ölçekte aynı kalır. */
export function zoomIn(scale: GanttScale): GanttScale {
  return SCALES[Math.max(SCALES.indexOf(scale) - 1, 0)]!
}
