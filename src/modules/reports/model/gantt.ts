/**
 * 01f Gantt bölümünün saf modeli (E-13-28; BE-123, pin v0.23.0-api): kaynak `reportSeason.tasks`
 * (`start_on`, `end_on`, `completed_on`, durum, gecikme bayrakları). Bağımlılık okları ÇİZİLMEZ
 * (E-13-28 kararı; PDF okları GAP-239). Ölçek takvim günüdür (saat dilimi etkisi yok): eksen
 * en erken başlangıcın ayının ilk gününden, en geç bitişin ayının son gününe uzanır; rapor günü
 * eksene yakınsa (en geç bitişten ≤ 31 gün sonra) "Rapor tarihi" çizgisi çizilir. Konumlar yüzdedir
 * (çizim genişlikten bağımsız). Sanallaştırma yoktur (5000 görev sınırı sunucuda, BE-132).
 */
import type { DepartmentSection, ReportTask } from './season-view'

const DAY_MS = 86_400_000
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/

/** `YYYY-AA-GG` → gün numarası (UTC gün); geçersizse `null`. */
export function dayNumber(day: string | null | undefined): number | null {
  const m = day ? DAY.exec(day) : null
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / DAY_MS : null
}

export interface GanttMonth {
  key: string
  /** Eksen genişliğinin yüzdesi. */
  width: number
  /** Ay başı ve 15'i için gün işaretleri (eksen yüzdesi). */
  ticks: { day: number; left: number }[]
}

export type GanttBarKind = 'plain' | 'overdue' | 'late' | 'done'

export interface GanttBar {
  left: number
  width: number
  /** Geç bitişte kırmızı kuyruk ya da açık gecikende kesik kenarlı kuyruk. */
  tail: { left: number; width: number; open: boolean } | null
  kind: GanttBarKind
}

export interface GanttTaskRow {
  id: string
  label: string
  title: string
  start: string
  end: string
  status: string
  bar: GanttBar | null
  /** Erişilebilir/başlık metni için gecikme bilgisi. */
  lateKind: 'overdue' | 'late' | 'early' | 'ontime' | 'none'
  lateDays: number
}

export interface GanttGroup {
  id: string
  name: string
  code: string | null
  count: number
  rows: GanttTaskRow[]
}

export interface GanttModel {
  groups: GanttGroup[]
  months: GanttMonth[]
  /** Rapor günü çizgisinin eksendeki yüzdesi; eksenin dışındaysa `null`. */
  today: number | null
  taskCount: number
  /** Eksenin ilk ve son ayı (`YYYY-AA`), başlık özeti için; görev yoksa `null`. */
  range: { from: string; to: string } | null
}

const pad = (n: number): string => String(n).padStart(2, '0')

function monthOf(dayNo: number): { y: number; m: number } {
  const d = new Date(dayNo * DAY_MS)
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() }
}
const monthStart = (y: number, m: number): number => Date.UTC(y, m, 1) / DAY_MS
const monthDays = (y: number, m: number): number => new Date(Date.UTC(y, m + 1, 0)).getUTCDate()

/** Göreve ait çubuk; tarihler geçersizse `null` (uydurma çubuk yok). */
export function taskBar(
  task: ReportTask,
  axisStart: number,
  axisLength: number,
  todayNo: number | null,
): GanttBar | null {
  const a = dayNumber(task.start_on)
  const end = dayNumber(task.end_on)
  if (a === null || end === null || axisLength <= 0) return null
  const b = end + 1
  const pct = (n: number): number => ((n - axisStart) / axisLength) * 100
  const done = task.status === 'tamamlandi' ? dayNumber(task.completed_on) : null
  if (done !== null) {
    const c = done + 1
    if (c > b) {
      return {
        left: pct(a),
        width: pct(b) - pct(a),
        tail: { left: pct(b), width: pct(c) - pct(b), open: false },
        kind: 'late',
      }
    }
    return { left: pct(a), width: pct(c) - pct(a), tail: null, kind: 'done' }
  }
  if (task.is_overdue) {
    // Açık gecikende kesik kırmızı kenar; kuyruk rapor gününe kadar (gün eksende değilse yalnız kenar).
    const tail =
      todayNo !== null && todayNo + 1 > b
        ? { left: pct(b), width: pct(todayNo + 0.5) - pct(b), open: true }
        : null
    return { left: pct(a), width: pct(b) - pct(a), tail, kind: 'overdue' }
  }
  return { left: pct(a), width: pct(b) - pct(a), tail: null, kind: 'plain' }
}

/** Görev etiketi: katalog kodu; yoksa `#<sıra numarası>`; ikisi de yoksa `—` (kod uydurulmaz). */
export function taskLabel(task: ReportTask): string {
  if (task.code) return task.code
  return task.sequence_no === null ? '—' : `#${task.sequence_no}`
}

function monthsOf(
  first: { y: number; m: number },
  last: { y: number; m: number },
  axisStart: number,
  length: number,
): GanttMonth[] {
  const months: GanttMonth[] = []
  for (let y = first.y, m = first.m; y < last.y || (y === last.y && m <= last.m);) {
    const start = monthStart(y, m)
    months.push({
      key: `${y}-${pad(m + 1)}`,
      width: (monthDays(y, m) / length) * 100,
      ticks: [1, 15].map((day) => ({ day, left: ((start + day - 1 - axisStart) / length) * 100 })),
    })
    m += 1
    if (m > 11) {
      m = 0
      y += 1
    }
  }
  return months
}

function lateOf(task: ReportTask): Pick<GanttTaskRow, 'lateKind' | 'lateDays'> {
  if (task.status !== 'tamamlandi') {
    return task.is_overdue
      ? { lateKind: 'overdue', lateDays: task.days_overdue }
      : { lateKind: 'none', lateDays: 0 }
  }
  if (task.is_completed_late) return { lateKind: 'late', lateDays: task.days_late }
  if (task.is_completed_early) return { lateKind: 'early', lateDays: task.days_early }
  return { lateKind: 'ontime', lateDays: 0 }
}

function groupOf(
  section: DepartmentSection,
  axisStart: number,
  length: number,
  todayNo: number | null,
): GanttGroup {
  return {
    id: section.id,
    name: section.name,
    code: section.code,
    count: section.tasks.length,
    rows: section.tasks.map((task) => ({
      id: task.work_item_id,
      label: taskLabel(task),
      title: task.title,
      start: task.start_on,
      end: task.end_on,
      status: task.status,
      bar: taskBar(task, axisStart, length, todayNo),
      ...lateOf(task),
    })),
  }
}

export function ganttModel(
  sections: readonly DepartmentSection[],
  reportDay: string | null,
): GanttModel {
  const tasks = sections.flatMap((s) => s.tasks)
  const valid = tasks
    .flatMap((t) => [
      dayNumber(t.start_on),
      dayNumber(t.end_on),
      t.status === 'tamamlandi' ? dayNumber(t.completed_on) : null,
    ])
    .filter((d): d is number => d !== null)
  if (valid.length === 0) return { groups: [], months: [], today: null, taskCount: 0, range: null }
  const lo = Math.min(...valid)
  const hi = Math.max(...valid)
  const first = monthOf(lo)
  const last = monthOf(hi)
  const axisStart = monthStart(first.y, first.m)
  const length = monthStart(last.y, last.m) + monthDays(last.y, last.m) - axisStart
  const months = monthsOf(first, last, axisStart, length)
  const reportNo = dayNumber(reportDay)
  const todayNo =
    reportNo !== null && reportNo >= axisStart && reportNo <= hi + 31 ? reportNo : null
  return {
    groups: sections.map((section) => groupOf(section, axisStart, length, todayNo)),
    months,
    today: todayNo === null ? null : ((todayNo + 0.5 - axisStart) / length) * 100,
    taskCount: tasks.length,
    range: { from: months[0]!.key, to: months[months.length - 1]!.key },
  }
}
