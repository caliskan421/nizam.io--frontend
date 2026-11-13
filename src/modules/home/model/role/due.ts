/**
 * Bitiş göstergesi (E-K1-16/20/24, E-Ü1-11): "bitiş 20.10 · 1 gün geç" / "3 gün kaldı".
 * Gecikme sunucudan (`days_overdue`, `is_overdue`); kalan gün = `end_on − bugün` (kurulum günü,
 * WORK-K37). Tamamlanmış görev için çağrılmaz.
 */
import type { WorkRow } from './common'
import { daysBetween, formatDayShort } from './dates'

export interface DueView {
  /** `GG.AA`. */
  date: string
  kind: 'late' | 'today' | 'left' | 'unknown'
  days: number
}

export function dueView(
  item: Pick<WorkRow, 'end_on' | 'is_overdue' | 'days_overdue'>,
  today: string,
): DueView {
  const date = formatDayShort(item.end_on)
  if (item.is_overdue) return { date, kind: 'late', days: item.days_overdue }
  const left = daysBetween(today, item.end_on)
  if (left === null) return { date, kind: 'unknown', days: 0 }
  if (left <= 0) return { date, kind: 'today', days: 0 }
  return { date, kind: 'left', days: left }
}
