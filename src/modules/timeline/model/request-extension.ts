/**
 * 03c E-03C-42 — tarih talebi uzantısı: seçili görevin bekleyen talebi (`pending_date_request`)
 * çubuğun yanında kesik çizgili bir parça olarak çizilir. Talep bitişi çubuğun planlanan bitişini
 * aşıyorsa sağ uzantı, başlangıcı çubuğun başlangıcından önceyse sol uzantı vardır; küçültme
 * talebinde uzantı yoktur (çizilecek ek alan yok). Yalnız geometri; yetki ve veri sayfadadır.
 */
import type { GanttDayRange, GanttScale } from '../components'
import { dayDiff, plannedEnd } from './dates'
import { DAY_WIDTH } from './timeline'
import type { GanttTask } from './types'

export interface DateRequestSpan {
  newStartOn: string
  newEndOn: string
}

export interface RequestExtension {
  side: 'start' | 'end'
  /** Uzantının sol kenarı (aralığın solunda kalan kısım 0'a kırpılır). */
  x: number
  w: number
}

export function requestExtensions(
  task: Pick<GanttTask, 'start_on' | 'end_on' | 'planned_end_on'>,
  request: DateRequestSpan,
  range: GanttDayRange,
  scale: GanttScale,
): RequestExtension[] {
  const dayW = DAY_WIDTH[scale]
  const start = dayDiff(range.start, task.start_on)
  const end = dayDiff(
    range.start,
    plannedEnd({ ...task, planned_end_on: task.planned_end_on ?? '' }),
  )
  const newStart = dayDiff(range.start, request.newStartOn)
  const newEnd = dayDiff(range.start, request.newEndOn)
  if (start === null || end === null) return []
  const out: RequestExtension[] = []
  if (newEnd !== null) {
    const from = (Math.max(end, start) + 1) * dayW
    const to = (newEnd + 1) * dayW
    if (to > from && to > 0)
      out.push({ side: 'end', x: Math.max(from, 0), w: to - Math.max(from, 0) })
  }
  if (newStart !== null) {
    const to = start * dayW
    const from = Math.max(newStart * dayW, 0)
    if (to > from) out.push({ side: 'start', x: from, w: to - from })
  }
  return out
}
