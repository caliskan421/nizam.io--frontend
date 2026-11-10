/**
 * Gantt görev satırı/çubuğu gösterim yardımcıları (saf): durum anahtarı ve rengi, gecikme
 * notu, ekran okuyucu özeti. Renk tek başına taşıyıcı değildir (E-03C-31, §7-21): her satırın
 * görünmez hücresi durumu ve gecikmeyi metinle söyler.
 */
import type { GanttTask } from '../../model/types'
import { plannedEnd } from '../../model/dates'
import { ganttText, shortDay } from './messages'

export type StatusKey =
  'baslanmadi' | 'devam_ediyor' | 'onaya_sunuldu' | 'iade_edildi' | 'tamamlandi'
export type StatusTone = 'todo' | 'doing' | 'review' | 'back' | 'done'

/** Durum → çubuk/nokta tonu (`--gp-*`). */
const TONE: Record<StatusKey, StatusTone> = {
  baslanmadi: 'todo',
  devam_ediyor: 'doing',
  onaya_sunuldu: 'review',
  iade_edildi: 'back',
  tamamlandi: 'done',
}

export function isStatusKey(status: string): status is StatusKey {
  return status in TONE
}

/** Bilinmeyen durum en nötr tonu (Başlamadı) alır. */
export function statusTone(status: string): StatusTone {
  return isStatusKey(status) ? TONE[status] : 'todo'
}

export function statusLabel(status: string): string {
  return ganttText(
    isStatusKey(status) ? `timeline.gantt.status.${status}` : 'timeline.gantt.status.unknown',
  )
}

/** "N gün gecikmede" / "N gün geç bitti"; gecikme yoksa `null`. */
export function latenessNote(task: Pick<GanttTask, 'lateness'>): string | null {
  const { lateness } = task
  if (lateness.is_overdue)
    return ganttText('timeline.gantt.overdue', { days: lateness.days_overdue })
  if (lateness.is_completed_late) {
    return ganttText('timeline.gantt.completedLate', { days: lateness.days_late })
  }
  return null
}

/** Durum noktası ipucu: `<Durum>` + ` · N gün gecikmede|geç bitti`. */
export function dotTitle(task: GanttTask): string {
  const note = latenessNote(task)
  return note ? `${statusLabel(task.status)} · ${note}` : statusLabel(task.status)
}

/** Yarım `--danger` noktası: gecikmede ya da geç bitişte. */
export function isLate(task: Pick<GanttTask, 'lateness'>): boolean {
  return task.lateness.is_overdue || task.lateness.is_completed_late
}

/** Satırın erişilebilir özeti: başlık, durum, tarih aralığı, gecikme, bağımlılık. */
export function rowSummary(task: GanttTask, dependent: boolean): string {
  const parts = [
    ganttText('timeline.gantt.rowSummary', {
      title: task.title,
      status: statusLabel(task.status),
      start: shortDay(task.start_on),
      end: shortDay(plannedEnd(task)),
    }),
  ]
  const note = latenessNote(task)
  if (note) parts.push(note)
  if (dependent) parts.push(ganttText('timeline.gantt.dependency'))
  return parts.join(', ')
}
