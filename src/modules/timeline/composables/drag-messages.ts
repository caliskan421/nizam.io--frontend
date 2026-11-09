/**
 * W95 metinleri (`timeline.snack.*`, `timeline.drag.*`): statik TR ağacı `trTimeline`
 * (`shared/i18n/tr/timeline.ts`); yalnız bu iki dal. Sunucu `message` alanı gösterilmez.
 */
import { i18n } from '@/shared/i18n'
import { trTimeline } from '@/shared/i18n/tr/timeline'

import { dayAndMonth } from '../model/date-change'

export { trTimeline }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type DragTextKey = Extract<
  Leaves<typeof trTimeline>,
  `timeline.snack.${string}` | `timeline.drag.${string}`
>

/** `timeline.snack.*` / `timeline.drag.*` metni (TR). */
export function dragText(key: DragTextKey, params?: Record<string, string | number>): string {
  return params ? i18n.global.t(key, params) : i18n.global.t(key)
}

type MonthKey = Extract<DragTextKey, `timeline.snack.month.${string}`>

/** `22 Haz` (gün + 3 harfli ay); bozuk tarih olduğu gibi döner. */
export function formatDay(iso: string): string {
  const parts = dayAndMonth(iso)
  if (!parts) return iso
  return `${parts[0]} ${dragText(`timeline.snack.month.m${parts[1]}` as MonthKey)}`
}

/** `22 Haz – 10 Eyl` (E-03C-69). */
export function formatRange(range: { start: string; end: string }): string {
  const [s, e] = [dayAndMonth(range.start), dayAndMonth(range.end)]
  if (!s || !e) return `${range.start} – ${range.end}`
  return dragText('timeline.snack.range', {
    startDay: s[0],
    startMonth: dragText(`timeline.snack.month.m${s[1]}` as MonthKey),
    endDay: e[0],
    endMonth: dragText(`timeline.snack.month.m${e[1]}` as MonthKey),
  })
}
