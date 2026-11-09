/**
 * Tarih değişimi hesapları (03c E-03C-47, 67…72; P8): güne yapışma, uç kısıtı, klavye adımı ve
 * bildirim farkı. Saf fonksiyonlar; `YYYY-MM-DD` (saat dilimsiz). Bozuk tarih `null` olur ve
 * çağıran en dar davranışa (değişiklik yok) düşer.
 *
 * Bitiş ucu kararı (W95): sürüklenen/ klavyeyle oynatılan bitiş **`end_on`**'dur — yazma
 * yollarının (extendWorkItem `new_end_on`, requestDateChange `new_end_on`, updateWorkItem
 * `end_on`) hepsinin hedefi canlı bitiştir. `planned_end_on` özgün plandır (geç tamamlamada
 * `end_on` tamamlanma gününe itilir; openapi `WorkItem.end_on`) ve bu akışta HİÇ yazılmaz.
 */
import type { GanttEdge } from '../components'
import { dayDiff, dayNumber } from './dates'

export interface DayRange {
  start: string
  end: string
}

const MS_PER_DAY = 86_400_000

/** `iso` gününe `days` ekler (negatif geri); geçersiz tarih `null`. */
export function addDays(iso: string, days: number): string | null {
  const n = dayNumber(iso)
  if (n === null || !Number.isInteger(days)) return null
  return new Date((n + days) * MS_PER_DAY).toISOString().slice(0, 10)
}

/**
 * Ucu `day`'e taşır; başlangıç bitişi, bitiş başlangıcı AŞAMAZ (aşarsa karşı uca yapışır).
 * Geçersiz tarih `null`.
 */
export function applyEdge(range: DayRange, edge: GanttEdge, day: string): DayRange | null {
  if (dayNumber(day) === null || dayDiff(range.start, range.end) === null) return null
  if (edge === 'start')
    return { start: dayDiff(day, range.end)! < 0 ? range.end : day, end: range.end }
  return { start: range.start, end: dayDiff(range.start, day)! < 0 ? range.start : day }
}

/** Ucu `delta` gün kaydırır (klavye); sınırı aşan adım karşı uçta durur. */
export function shiftEdge(range: DayRange, edge: GanttEdge, delta: number): DayRange | null {
  const moved = addDays(edge === 'start' ? range.start : range.end, delta)
  return moved === null ? null : applyEdge(range, edge, moved)
}

export interface KeyLike {
  key: string
  shiftKey: boolean
  altKey: boolean
  ctrlKey?: boolean
  metaKey?: boolean
}

export interface DateKeyStep {
  edge: GanttEdge
  delta: 1 | -1
}

/**
 * Klavye tarih adımı (gantt-secimi §7): Shift+→/← bitiş ±1 gün, Alt+Shift+→/← başlangıç ±1
 * gün. Ctrl/Meta ile birleşim ve Shift'siz oklar (gezinme/aç-kapa) `null`.
 */
export function dateKeyStep(e: KeyLike): DateKeyStep | null {
  if (!e.shiftKey || e.ctrlKey || e.metaKey) return null
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return null
  return { edge: e.altKey ? 'start' : 'end', delta: e.key === 'ArrowRight' ? 1 : -1 }
}

export interface RangeDelta {
  /** `after - before` gün; pozitif = ileri. */
  start: number
  end: number
}

/** Bildirim farkı (E-03C-69 "bitiş ±N gün"); tarih bozuksa `null`. */
export function rangeDelta(before: DayRange, after: DayRange): RangeDelta | null {
  const start = dayDiff(before.start, after.start)
  const end = dayDiff(before.end, after.end)
  return start === null || end === null ? null : { start, end }
}

export function sameRange(a: DayRange, b: DayRange): boolean {
  return a.start === b.start && a.end === b.end
}

/** `YYYY-MM-DD` → `[gün, ay no 1–12]`; bozuksa `null`. */
export function dayAndMonth(iso: string): [number, number] | null {
  if (dayNumber(iso) === null) return null
  return [Number(iso.slice(8, 10)), Number(iso.slice(5, 7))]
}
