/**
 * Kendi SVG Gantt'ın zaman katmanı (W92; saf, DOM'suz). Aralık, ölçek, tarih↔x, çubuk geometrisi
 * (plan + taşma), eksen başlığı, kaydırma → görünen aralık ve uç sürükleme yapışması buradadır.
 * Ölçüler `design/web-tokens.json` `gantt` grubundan (`TOKENS`) okunur: CSS ile tek kaynak.
 * Tarihler `YYYY-MM-DD` takvim günüdür (saat dilimsiz, `dates.ts`); bozuk değer `null`/çizilmez.
 */
import { TOKENS } from '@/shared/tokens/tokens.gen'

import type { GanttDayRange, GanttEdge, GanttScale } from '../components'
import { dayDiff, dayNumber, plannedEnd } from './dates'
import type { GanttTask } from './types'

type TokenName = keyof typeof TOKENS

/** Token değerinin sayısal px karşılığı (`"21px"` → 21). */
function px(name: TokenName): number {
  return Number.parseFloat(TOKENS[name].dark)
}

/** Çizim ölçüleri (kullanıcı birimi = px); hepsi `gantt-*` token'ıdır. */
export const GEOMETRY = {
  labelW: px('gantt-label-w'),
  axisMonthH: px('gantt-axis-month-h'),
  axisDayH: px('gantt-axis-day-h'),
  headH: px('gantt-axis-month-h') + px('gantt-axis-day-h'),
  groupH: px('gantt-group-h'),
  rowH: px('gantt-row-h'),
  barH: px('gantt-bar-h'),
  barR: px('gantt-bar-radius'),
  barTop: (px('gantt-row-h') - px('gantt-bar-h')) / 2,
  handleW: px('gantt-handle-w'),
  handleH: px('gantt-handle-h'),
  handleR: px('gantt-handle-r'),
  summaryH: px('gantt-summary-h'),
  depIcon: px('gantt-dep-icon'),
  pillW: px('gantt-today-pill-w'),
  pillH: px('gantt-today-pill-h'),
  pillR: px('gantt-today-pill-r'),
  /** Çubuk iç boşluğu (`--space-2`). */
  barPad: px('space-2'),
} as const

/** Ölçek başına gün genişliği: gün 21 px / hafta 6 px / ay 2 px (`gantt-secimi.md` §7). */
export const DAY_WIDTH: Readonly<Record<GanttScale, number>> = {
  gun: px('gantt-day-w-gun'),
  hafta: px('gantt-day-w-hafta'),
  ay: px('gantt-day-w-ay'),
}

/** En dar çubuk genişliği: tek günlük görev ay ölçeğinde de görünür kalır. */
export const MIN_BAR_W = GEOMETRY.handleW + 2
/** Çubuk yazısı için karakter başına tahmini genişlik (12 px / 600; kesme tahmini). */
export const TEXT_CHAR_PX = 7
/** Sürenin çubuk içinde yazılabilmesi için en dar plan genişliği. */
export const DURATION_MIN_W = 96

const MS_PER_DAY = 86_400_000

// --- Takvim günü yardımcıları ------------------------------------------------------------

/** Gün sayısından `YYYY-MM-DD` üretir (UTC). */
export function dayIso(dayNum: number): string {
  return new Date(dayNum * MS_PER_DAY).toISOString().slice(0, 10)
}

/** Günü `n` gün öteler; geçersiz gün `null`. */
export function addDays(iso: string, n: number): string | null {
  const num = dayNumber(iso)
  return num === null ? null : dayIso(num + n)
}

/** Haftanın günü, Pazartesi = 0 … Pazar = 6; geçersiz gün `null`. */
export function weekdayOf(iso: string): number | null {
  const num = dayNumber(iso)
  // 1970-01-01 Perşembe (3).
  return num === null ? null : (((num + 3) % 7) + 7) % 7
}

/** Verilen günde ya da ondan önceki Pazartesi. */
export function mondayOnOrBefore(iso: string): string | null {
  const wd = weekdayOf(iso)
  return wd === null ? null : addDays(iso, -wd)
}

/** `{ year, month(0-11), day }`; geçersiz gün `null`. */
export function dateParts(iso: string): { year: number; month: number; day: number } | null {
  if (dayNumber(iso) === null) return null
  return {
    year: Number(iso.slice(0, 4)),
    month: Number(iso.slice(5, 7)) - 1,
    day: Number(iso.slice(8, 10)),
  }
}

/** Aralığın gün sayısı (uçlar dahil). */
export function rangeDays(range: GanttDayRange): number {
  return (dayDiff(range.start, range.end) ?? 0) + 1
}

// --- Aralık --------------------------------------------------------------------------------

export interface RangeOptions {
  /** Tuvalin dolması gereken en az gün sayısı (görünür genişlikten türetilir). */
  minDays?: number
  /** Başa eklenen pay (gün). */
  padBefore?: number
  /** Sona eklenen pay (gün). */
  padAfter?: number
}

/** Çubuğun çizebileceği en uç günler (başlangıç, plan sonu, tamamlanma). */
function taskExtent(task: GanttTask): string[] {
  const days = [task.start_on, plannedEnd(task), task.end_on, task.completed_on]
  return days.filter((d) => dayNumber(d) !== null)
}

/**
 * Tuval aralığı: yüklü görevlerin ve bugünün en erken/en geç günleri, başa/sona pay; başlangıç
 * Pazartesi'ye hizalanır (hafta çizgileri düzenli). Görev yoksa bugünün çevresi.
 */
export function ganttRange(
  tasks: readonly GanttTask[],
  today: string,
  options: RangeOptions = {},
): GanttDayRange {
  const { minDays = 0, padBefore = 7, padAfter = 14 } = options
  const days = [today, ...tasks.flatMap(taskExtent)].filter((d) => dayNumber(d) !== null)
  if (days.length === 0) return { start: today, end: today }
  const sorted = [...days].sort()
  const first = sorted[0]!
  const last = sorted[sorted.length - 1]!
  const start = mondayOnOrBefore(addDays(first, -padBefore) ?? first) ?? first
  let end = addDays(last, padAfter) ?? last
  const missing = minDays - ((dayDiff(start, end) ?? 0) + 1)
  if (missing > 0) end = addDays(end, missing) ?? end
  return { start, end }
}

/** Günün sol kenarının x konumu (tuval başı 0); aralık dışı gün de hesaplanır, geçersiz `null`. */
export function dayX(range: GanttDayRange, scale: GanttScale, iso: string): number | null {
  const diff = dayDiff(range.start, iso)
  return diff === null ? null : diff * DAY_WIDTH[scale]
}

/** Tuvalin toplam genişliği. */
export function rangeWidth(range: GanttDayRange, scale: GanttScale): number {
  return rangeDays(range) * DAY_WIDTH[scale]
}

/** x konumunu içeren gün (aralığa kenetli). */
export function xToDay(range: GanttDayRange, scale: GanttScale, x: number): string {
  const index = Math.min(Math.max(Math.floor(x / DAY_WIDTH[scale]), 0), rangeDays(range) - 1)
  return addDays(range.start, index) ?? range.start
}

/**
 * Sürüklenen ucun yapıştığı gün: başlangıç ucu gün sınırının sol kenarına, bitiş ucu gün sınırının
 * sağ kenarına (bitiş günü dahil) yapışır; hafta/ay ölçeğinde de gün birimidir.
 */
export function snapEdgeDay(
  edge: GanttEdge,
  x: number,
  range: GanttDayRange,
  scale: GanttScale,
): string {
  const boundary = Math.round(x / DAY_WIDTH[scale])
  const index = Math.min(
    Math.max(edge === 'start' ? boundary : boundary - 1, 0),
    rangeDays(range) - 1,
  )
  return addDays(range.start, index) ?? range.start
}

/** Kaydırma konumuna karşılık gelen görünen gün aralığı (aralığa kenetli). */
export function visibleRange(
  range: GanttDayRange,
  scale: GanttScale,
  scrollLeft: number,
  viewWidth: number,
): GanttDayRange {
  const dayW = DAY_WIDTH[scale]
  const total = rangeDays(range)
  const first = Math.min(Math.max(Math.floor(scrollLeft / dayW), 0), total - 1)
  const last = Math.min(Math.max(Math.ceil((scrollLeft + viewWidth) / dayW) - 1, first), total - 1)
  return {
    start: addDays(range.start, first) ?? range.start,
    end: addDays(range.start, last) ?? range.end,
  }
}

/** Verilen günü görünür alanın ortasına getiren `scrollLeft` (negatif olmaz). */
export function scrollLeftFor(
  range: GanttDayRange,
  scale: GanttScale,
  iso: string,
  viewWidth: number,
): number {
  const x = dayX(range, scale, iso)
  if (x === null) return 0
  return Math.max(0, x + DAY_WIDTH[scale] / 2 - viewWidth / 2)
}

// --- Çubuk geometrisi ----------------------------------------------------------------------

export interface BarGeometry {
  /** Çubuğun sol kenarı (kırpıldıysa 0). */
  x: number
  /** Plan bölümü genişliği (başlangıç → planlanan bitiş, bitiş günü dahil). */
  planW: number
  /** Taşma bölümü genişliği (gecikmede bugüne, geç bitişte tamamlanma gününe); yoksa 0. */
  overW: number
  /** Planın sağ kenarı = bitiş tutamacının konumu. */
  planRight: number
  /** Çubuğun toplam sağ kenarı. */
  right: number
  /** Başlangıç görünen aralıktan önce: sol köşeler düz (E-03C-43). */
  clipLeft: boolean
  /** Taşmanın nedeni. */
  overflow: 'overdue' | 'completed-late' | null
}

export interface BarContext {
  range: GanttDayRange
  scale: GanttScale
  today: string
}

/** Tarihleri üzerine yazılabilen çubuk girdisi (sürükleme önizlemesi için). */
export type BarDates = Pick<
  GanttTask,
  'start_on' | 'planned_end_on' | 'end_on' | 'completed_on'
> & {
  lateness: GanttTask['lateness']
}

function overflowDay(
  task: BarDates,
  today: string,
): { day: string; kind: 'overdue' | 'completed-late' } | null {
  if (task.lateness.is_overdue) return { day: today, kind: 'overdue' }
  if (task.lateness.is_completed_late && dayNumber(task.completed_on) !== null) {
    return { day: task.completed_on, kind: 'completed-late' }
  }
  return null
}

/**
 * Çubuk geometrisi: `start_on` → planlanan bitiş (`planned_end_on` boşsa `end_on`), bitiş günü
 * dahil. Gecikmede uç bugün, geç bitişte `completed_on` (E-03C-40). Tarihi bozuk ya da tümüyle
 * aralığın solunda kalan görev için `null` (çizilmez).
 */
export function barGeometry(task: BarDates, ctx: BarContext): BarGeometry | null {
  const dayW = DAY_WIDTH[ctx.scale]
  const startDiff = dayDiff(ctx.range.start, task.start_on)
  const endDiff = dayDiff(ctx.range.start, plannedEnd(task))
  if (startDiff === null || endDiff === null) return null
  const left = startDiff * dayW
  const planRightRaw = (Math.max(endDiff, startDiff) + 1) * dayW
  if (planRightRaw <= 0) return null
  const clipLeft = left < 0
  const x = clipLeft ? 0 : left
  const planRight = Math.max(planRightRaw, x + MIN_BAR_W)
  const over = overflowDay(task, ctx.today)
  const overDiff = over ? dayDiff(ctx.range.start, over.day) : null
  const overRight = overDiff === null ? 0 : (overDiff + 1) * dayW
  const overW = overRight > planRight ? overRight - planRight : 0
  return {
    x,
    planW: planRight - x,
    overW,
    planRight,
    right: planRight + overW,
    clipLeft,
    overflow: overW > 0 && over ? over.kind : null,
  }
}

/** Plan aralığının süresi (gün, uçlar dahil); bozuk tarih `null`. */
export function planDays(
  task: Pick<GanttTask, 'start_on' | 'planned_end_on' | 'end_on'>,
): number | null {
  const diff = dayDiff(task.start_on, plannedEnd(task))
  return diff === null ? null : Math.max(diff, 0) + 1
}

export type DurationUnit = 'day' | 'week' | 'month'

/** Süre yazısı: ölçeğe göre gün "g" / hafta "hf" / ay "ay" (E-03C-39); en az 1. */
export function durationLabel(
  days: number,
  scale: GanttScale,
): { value: number; unit: DurationUnit } {
  if (scale === 'gun') return { value: days, unit: 'day' }
  if (scale === 'hafta') return { value: Math.max(1, Math.round(days / 7)), unit: 'week' }
  return { value: Math.max(1, Math.round(days / 30)), unit: 'month' }
}

/** Çubuk yazısını `maxPx` genişliğe göre keser (sonuna `…`); sığmıyorsa boş. */
export function truncateLabel(text: string, maxPx: number): string {
  const fit = Math.floor(maxPx / TEXT_CHAR_PX)
  if (fit <= 0) return ''
  if (text.length <= fit) return text
  return fit <= 1 ? '' : `${text.slice(0, fit - 1).trimEnd()}…`
}

/** Köşeleri seçilebilir yuvarlatılmış dikdörtgen yolu (çubuk parçaları için). */
export function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  round: { left: boolean; right: boolean },
): string {
  const rr = Math.min(r, w / 2, h / 2)
  const rl = round.left ? rr : 0
  const rt = round.right ? rr : 0
  return [
    `M${x + rl},${y}`,
    `H${x + w - rt}`,
    rt ? `A${rt},${rt} 0 0 1 ${x + w},${y + rt}` : '',
    `V${y + h - rt}`,
    rt ? `A${rt},${rt} 0 0 1 ${x + w - rt},${y + h}` : '',
    `H${x + rl}`,
    rl ? `A${rl},${rl} 0 0 1 ${x},${y + h - rl}` : '',
    `V${y + rl}`,
    rl ? `A${rl},${rl} 0 0 1 ${x + rl},${y}` : '',
    'Z',
  ]
    .filter(Boolean)
    .join(' ')
}

// --- Eksen ---------------------------------------------------------------------------------

export interface AxisCell {
  key: string
  x: number
  width: number
  kind: 'year' | 'month' | 'week' | 'day'
  year: number
  /** 0-11; yıl hücresinde 0. */
  month: number
  /** Ayın günü (hafta/gün hücresinde). */
  day: number
  /** Bugünü içeren hücre (hafta/gün) ya da bugünün ayı. */
  current: boolean
}

export interface AxisModel {
  width: number
  /** Üst satır: ay (hafta/gün ölçeği) ya da yıl (ay ölçeği). */
  top: AxisCell[]
  /** Alt satır: hafta başı (hafta), haftalık etiket (gün) ya da ay (ay ölçeği). */
  bottom: AxisCell[]
  /** Dikey ızgara çizgileri (x). */
  lines: number[]
  /** Hafta sonu gölgeleri (yalnız gün ölçeği). */
  weekends: { x: number; width: number }[]
  /** Bugünün sütun ortası; aralık dışıysa `null`. */
  todayX: number | null
}

function cell(
  kind: AxisCell['kind'],
  start: string,
  x: number,
  width: number,
  current: boolean,
): AxisCell {
  const p = dateParts(start)!
  return {
    key: `${kind}:${start}`,
    x,
    width,
    kind,
    year: p.year,
    month: p.month,
    day: p.day,
    current,
  }
}

/** Aralıkla kesişen ay (ya da yıl) parçaları; her parça aralığa kırpılır. */
function calendarCells(
  range: GanttDayRange,
  scale: GanttScale,
  kind: 'month' | 'year',
  today: string,
): AxisCell[] {
  const dayW = DAY_WIDTH[scale]
  const out: AxisCell[] = []
  const total = rangeDays(range)
  let index = 0
  while (index < total) {
    const iso = addDays(range.start, index)!
    const p = dateParts(iso)!
    const nextStart =
      kind === 'month'
        ? dayIso(Date.UTC(p.year, p.month + 1, 1) / MS_PER_DAY)
        : dayIso(Date.UTC(p.year + 1, 0, 1) / MS_PER_DAY)
    const span = Math.min(dayDiff(iso, nextStart) ?? 1, total - index)
    const t = dateParts(today)
    const current = t !== null && t.year === p.year && (kind === 'year' || t.month === p.month)
    out.push(cell(kind, iso, index * dayW, span * dayW, current))
    index += span
  }
  return out
}

/** Aralıktaki Pazartesi günleri (gün indeksiyle). */
function mondayIndexes(range: GanttDayRange): number[] {
  const first = weekdayOf(range.start) ?? 0
  const out: number[] = []
  for (let i = (7 - first) % 7; i < rangeDays(range); i += 7) out.push(i)
  return out
}

/**
 * Eksen başlığı (E-03C-23…26): ay satırı + hafta/gün satırı, ızgara çizgileri, gün ölçeğinde
 * hafta sonu gölgesi. Ay ölçeğinde üst satır yıl, alt satır ay.
 */
export function axisModel(scale: GanttScale, range: GanttDayRange, today: string): AxisModel {
  const dayW = DAY_WIDTH[scale]
  const total = rangeDays(range)
  const todayIndex = dayDiff(range.start, today)
  const todayX =
    todayIndex !== null && todayIndex >= 0 && todayIndex < total
      ? todayIndex * dayW + dayW / 2
      : null
  if (scale === 'ay') {
    const months = calendarCells(range, scale, 'month', today)
    return {
      width: total * dayW,
      top: calendarCells(range, scale, 'year', today),
      bottom: months,
      lines: months.map((c) => c.x).filter((x) => x > 0),
      weekends: [],
      todayX,
    }
  }
  const mondays = mondayIndexes(range)
  const bottom = mondays.map((i) => {
    const iso = addDays(range.start, i)!
    const current = todayIndex !== null && todayIndex >= i && todayIndex < i + 7
    return cell(
      scale === 'gun' ? 'day' : 'week',
      iso,
      i * dayW,
      Math.min(7, total - i) * dayW,
      current,
    )
  })
  const weekends =
    scale === 'gun'
      ? Array.from({ length: total }, (_, i) => i)
          .filter((i) => (weekdayOf(addDays(range.start, i)!) ?? 0) >= 5)
          .map((i) => ({ x: i * dayW, width: dayW }))
      : []
  return {
    width: total * dayW,
    top: calendarCells(range, scale, 'month', today),
    bottom,
    lines: mondays.map((i) => i * dayW).filter((x) => x > 0),
    weekends,
    todayX,
  }
}
