/**
 * Alt görev (03d) ekran metinleri (`timeline.subtasks.*`; tek ağaç `trTimeline`, KESİN 24).
 * Sunucu `message` alanı gösterilmez; hata metni `UiErrorState` üzerinden hata kodundan gelir.
 */
import { i18n } from '@/shared/i18n'
import type { trTimeline } from '@/shared/i18n/tr/timeline'

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type SubtaskTextKey = Leaves<(typeof trTimeline)['timeline']['subtasks']>

/** `timeline.subtasks.*` metni (TR). */
export function subtaskText(
  key: SubtaskTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(`timeline.subtasks.${key}`, params)
}
