/**
 * Gantt satır düzlemi (W92; saf): koordinatörlük grubu → görev. Görevler `department_id`'ye göre
 * gruplanır, grup başlığı + (açıksa) görev satırları tek düz listeye açılır; her satırın `y`
 * ofseti önceden hesaplanır, böylece pencere (sanallaştırma) ikili aramayla bulunur ve oklar DOM
 * ölçmeden satır ofsetlerinden çizilir (`gantt-secimi.md` §7 `rows.ts`).
 */
import { dayNumber, plannedEnd } from './dates'
import { GEOMETRY } from './timeline'
import type { GanttLink, GanttTask } from './types'

export const TASK_STATUS_DONE = 'tamamlandi'

export interface GroupRow {
  kind: 'group'
  key: string
  level: 1
  departmentId: string
  /** Departman adı; çözülemediyse `null` (bileşen nötr etiket yazar). */
  name: string | null
  open: boolean
  total: number
  done: number
  /** Gruptaki görevlerden en az biri gecikmede (özet izde işaret). */
  hasOverdue: boolean
  /** Grup aralığı: en erken başlangıç – en geç planlanan bitiş; tarihli görev yoksa `null`. */
  span: { start: string; end: string } | null
  y: number
  height: number
}

export interface TaskRow {
  kind: 'task'
  key: string
  level: 2
  task: GanttTask
  groupKey: string
  y: number
  height: number
  /** Açık alt görev satırı sayısı (0 = kapalı); satırın hemen altına `subH` × bu kadar yer açılır. */
  subRows: number
  /** Alt görev bloğunun üst kenarı (`y + height`). */
  subY: number
}

export type GanttRow = GroupRow | TaskRow

export interface GanttLayout {
  rows: readonly GanttRow[]
  /** Satırların toplam yüksekliği (başlık hariç). */
  height: number
  indexByKey: ReadonlyMap<string, number>
  /** Görevin `target` (bağımlı) olduğu bir bağı var: çubukta zincir simgesi (E-03C-37). */
  dependentIds: ReadonlySet<string>
}

export interface LayoutInput {
  tasks: readonly GanttTask[]
  links: readonly GanttLink[]
  departmentNames: ReadonlyMap<string, string>
  /** Kapalı grupların anahtarları (`groupKey`); varsayılan hepsi açık. */
  collapsed: ReadonlySet<string>
  /**
   * Açık alt görev satırları: görev kimliği → alt satır sayısı (yükleniyor / boş / hata = 1).
   * Açık görevin altına `sayı × alt satır yüksekliği` eklenir, sonraki satırların `y`'si kayar;
   * çubuk, ızgara ve oklar aynı düzlemi kullanır (03d E-03C-33).
   */
  subtaskRows?: ReadonlyMap<string, number>
}

export function groupKey(departmentId: string): string {
  return `g:${departmentId}`
}

const collator = new Intl.Collator('tr')

function compareTasks(a: GanttTask, b: GanttTask): number {
  return (
    a.start_on.localeCompare(b.start_on) ||
    plannedEnd(a).localeCompare(plannedEnd(b)) ||
    collator.compare(a.title, b.title) ||
    a.work_item_id.localeCompare(b.work_item_id)
  )
}

function groupSpan(tasks: readonly GanttTask[]): GroupRow['span'] {
  let start: string | null = null
  let end: string | null = null
  for (const task of tasks) {
    const taskEnd = plannedEnd(task)
    if (dayNumber(task.start_on) === null || dayNumber(taskEnd) === null) continue
    if (start === null || task.start_on < start) start = task.start_on
    if (end === null || taskEnd > end) end = taskEnd
  }
  return start !== null && end !== null ? { start, end } : null
}

interface TaskGroup {
  departmentId: string
  name: string | null
  tasks: GanttTask[]
}

/** Görevleri departmana göre gruplar: görevler tarihe, gruplar ada göre sıralı. */
function groupTasks(input: LayoutInput): TaskGroup[] {
  const byDepartment = new Map<string, GanttTask[]>()
  for (const task of input.tasks) {
    const bucket = byDepartment.get(task.department_id)
    if (bucket) bucket.push(task)
    else byDepartment.set(task.department_id, [task])
  }
  return [...byDepartment.entries()]
    .map(([departmentId, tasks]) => ({
      departmentId,
      name: input.departmentNames.get(departmentId) ?? null,
      tasks: [...tasks].sort(compareTasks),
    }))
    .sort(
      (a, b) =>
        Number(a.name === null) - Number(b.name === null) ||
        collator.compare(a.name ?? '', b.name ?? '') ||
        a.departmentId.localeCompare(b.departmentId),
    )
}

function groupRow(group: TaskGroup, open: boolean, y: number): GroupRow {
  return {
    kind: 'group',
    key: groupKey(group.departmentId),
    level: 1,
    departmentId: group.departmentId,
    name: group.name,
    open,
    total: group.tasks.length,
    done: group.tasks.filter((t) => t.status === TASK_STATUS_DONE).length,
    hasOverdue: group.tasks.some((t) => t.lateness.is_overdue),
    span: groupSpan(group.tasks),
    y,
    height: GEOMETRY.groupH,
  }
}

/** Görevleri gruplayıp düz, ofsetli satır listesine açar. */
export function buildLayout(input: LayoutInput): GanttLayout {
  const rows: GanttRow[] = []
  let y = 0
  for (const group of groupTasks(input)) {
    const key = groupKey(group.departmentId)
    const open = !input.collapsed.has(key)
    rows.push(groupRow(group, open, y))
    y += GEOMETRY.groupH
    if (!open) continue
    for (const task of group.tasks) {
      const subRows = Math.max(0, input.subtaskRows?.get(task.work_item_id) ?? 0)
      rows.push({
        kind: 'task',
        key: task.work_item_id,
        level: 2,
        task,
        groupKey: key,
        y,
        height: GEOMETRY.rowH,
        subRows,
        subY: y + GEOMETRY.rowH,
      })
      y += GEOMETRY.rowH + subRows * GEOMETRY.subH
    }
  }
  return {
    rows,
    height: y,
    indexByKey: new Map(rows.map((row, index) => [row.key, index])),
    dependentIds: new Set(input.links.map((link) => link.target)),
  }
}

/** `y` konumunu içeren satırın indeksi (ikili arama); satır yoksa -1. */
export function rowAt(rows: readonly GanttRow[], y: number): number {
  if (rows.length === 0) return -1
  let lo = 0
  let hi = rows.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (rows[mid]!.y <= y) lo = mid
    else hi = mid - 1
  }
  return lo
}

export interface RowWindow {
  /** İlk görünür satır indeksi (kapsayıcı); satır yoksa 0. */
  first: number
  /** Son görünür satır indeksi (kapsayıcı); satır yoksa -1. */
  last: number
}

/** `[top, top + height]` aralığını (artı pay) kaplayan satır penceresi. */
export function rowWindow(
  rows: readonly GanttRow[],
  top: number,
  height: number,
  overscan = 4,
): RowWindow {
  if (rows.length === 0) return { first: 0, last: -1 }
  const first = Math.max(0, rowAt(rows, Math.max(top, 0)) - overscan)
  const last = Math.min(rows.length - 1, rowAt(rows, Math.max(top + height, 0)) + overscan)
  return { first, last }
}

/** Satırı görünür alana alan en küçük `scrollTop` (zaten görünürse aynısı). */
export function revealScrollTop(
  row: Pick<GanttRow, 'y' | 'height'>,
  scrollTop: number,
  viewHeight: number,
): number {
  if (row.y < scrollTop) return row.y
  if (row.y + row.height > scrollTop + viewHeight)
    return Math.max(0, row.y + row.height - viewHeight)
  return scrollTop
}
