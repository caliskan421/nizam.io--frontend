/**
 * Gantt klavye gezinmesi (W92 gezinme kısmı; W95 tarih değiştirme kısmını `onDateKey` ile
 * doldurur — dal zinciri, KESİN 25). WAI-ARIA `treegrid` modeli (`gantt-secimi.md` §7):
 *  - ↑ ↓ bir satır, PageUp/PageDown bir sayfa, Home/End ilk/son satır;
 *  - → kapalı grubu açar, açık grupta ilk görevine geçer; ← açık grubu kapatır, görevde üst
 *    grubuna geçer;
 *  - Enter/Boşluk görevi seçer, grup satırında açıp kapatır.
 * Shift+→/← (bitiş) ve Alt+Shift+→/← (başlangıç) tarih kısayoludur: YALNIZ `onDateKey` verilmişse
 * ve görev satırındaysa işlenir; verilmemişse hiçbir şey yapılmaz (olay tarayıcıya kalır). Hangi
 * yüzün tarih değiştirebildiği (P8: üyede yok) çağıranın/W95'in kararıdır.
 */
import type { GanttEdge } from '../components'

export type KeyRow =
  { kind: 'group'; key: string; open: boolean } | { kind: 'task'; key: string; groupKey: string }

/** Klavyeyle tarih değiştirme isteği: `days` ±1 gün; `edge` Shift → bitiş, Alt+Shift → başlangıç. */
export interface DateKeyRequest {
  workItemId: string
  edge: GanttEdge
  days: 1 | -1
}

export interface GanttKeyboardOptions {
  rows: () => readonly KeyRow[]
  /** PageUp/PageDown adımı (görünür satır sayısı). */
  pageSize: () => number
  /** Odağı verilen indeksteki satıra taşır (gerekirse kaydırarak). */
  focusRow: (index: number) => void
  setGroupOpen: (groupKey: string, open: boolean) => void
  select: (workItemId: string) => void
  /** W95 uzantı noktası: `false` döndürürse olay işlenmemiş sayılır. */
  onDateKey?: (request: DateKeyRequest) => boolean | void
}

export interface GanttKeyboard {
  /** Satır `keydown` işleyicisi; işlenen olayda `preventDefault` çağrılır. */
  onKeydown: (event: KeyboardEvent, index: number) => void
}

function clamp(index: number, rows: readonly KeyRow[]): number {
  return Math.min(Math.max(index, 0), rows.length - 1)
}

function dateKey(options: GanttKeyboardOptions, event: KeyboardEvent, row: KeyRow): boolean {
  if (row.kind !== 'task' || !options.onDateKey) return false
  const result = options.onDateKey({
    workItemId: row.key,
    edge: event.altKey ? 'start' : 'end',
    days: event.key === 'ArrowRight' ? 1 : -1,
  })
  return result !== false
}

function horizontal(
  options: GanttKeyboardOptions,
  event: KeyboardEvent,
  rows: readonly KeyRow[],
  index: number,
): boolean {
  const row = rows[index]!
  const right = event.key === 'ArrowRight'
  if (row.kind === 'group') {
    if (right && !row.open) options.setGroupOpen(row.key, true)
    else if (right && rows[index + 1]?.kind === 'task') options.focusRow(index + 1)
    else if (!right && row.open) options.setGroupOpen(row.key, false)
    else return false
    return true
  }
  if (right) return false
  const parent = rows.findIndex((r) => r.key === row.groupKey)
  if (parent < 0) return false
  options.focusRow(parent)
  return true
}

function vertical(
  options: GanttKeyboardOptions,
  key: string,
  rows: readonly KeyRow[],
  index: number,
): boolean {
  const page = Math.max(options.pageSize(), 1)
  const target: Record<string, number> = {
    ArrowDown: index + 1,
    ArrowUp: index - 1,
    PageDown: index + page,
    PageUp: index - page,
    Home: 0,
    End: rows.length - 1,
  }
  if (!(key in target)) return false
  options.focusRow(clamp(target[key]!, rows))
  return true
}

function navigate(
  options: GanttKeyboardOptions,
  event: KeyboardEvent,
  rows: readonly KeyRow[],
  index: number,
): boolean {
  const row = rows[index]!
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    return horizontal(options, event, rows, index)
  }
  if (event.key === 'Enter' || event.key === ' ') {
    if (row.kind === 'group') options.setGroupOpen(row.key, !row.open)
    else options.select(row.key)
    return true
  }
  return vertical(options, event.key, rows, index)
}

export function useGanttKeyboard(options: GanttKeyboardOptions): GanttKeyboard {
  function onKeydown(event: KeyboardEvent, index: number): void {
    const rows = options.rows()
    if (!rows[index] || event.ctrlKey || event.metaKey) return
    const arrow = event.key === 'ArrowRight' || event.key === 'ArrowLeft'
    let handled: boolean
    if (event.shiftKey && arrow) handled = dateKey(options, event, rows[index])
    else if (event.shiftKey || event.altKey) handled = false
    else handled = navigate(options, event, rows, index)
    if (handled) event.preventDefault()
  }

  return { onKeydown }
}
