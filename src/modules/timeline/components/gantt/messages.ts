import { i18n } from '@/shared/i18n'
import type { trTimeline } from '@/shared/i18n/tr/timeline'

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type GanttTextKey = `timeline.gantt.${Leaves<typeof trTimeline.timeline.gantt>}`

/** `timeline.gantt.*` metni (TR; sunucu metni kullanılmaz). */
export function ganttText(key: GanttTextKey, params: Record<string, string | number> = {}): string {
  return i18n.global.t(key, params)
}

/** Ayın adı (`month`: 0-11). */
export function monthName(month: number, form: 'long' | 'short' = 'long'): string {
  return ganttText(`timeline.gantt.month.${form}.m${month + 1}` as GanttTextKey)
}

/** `22 Haz` biçimi (gün + 3 harfli ay); geçersiz gün boş. */
export function shortDay(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  return `${Number(iso.slice(8, 10))} ${monthName(Number(iso.slice(5, 7)) - 1, 'short')}`
}
