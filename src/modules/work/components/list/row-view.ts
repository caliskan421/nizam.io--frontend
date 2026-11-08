/**
 * Görev satırının gösterim değerleri (03 `ozellikler.md` §2.7, `backend.md` §1/§4). Sunucu
 * hesapları olduğu gibi kullanılır: "gün gecikti" `is_overdue`/`days_overdue`; yalnız "gün
 * kaldı" istemcide (`end_on − bugün`, Europe/Istanbul). Tamamlanmış görevde not yok (E-03-25).
 */
import type { WorkItem, WorkItemStatus } from '../../model/types'
import { daysBetween, formatShortDay } from './dates'
import { taskListText } from './messages'

/** Durum noktası (`rp-dot--*`; E-03-23, `iade_edildi` = `back`). */
export const STATUS_DOT: Readonly<Record<WorkItemStatus, string>> = {
  baslanmadi: 'todo',
  devam_ediyor: 'doing',
  onaya_sunuldu: 'review',
  iade_edildi: 'back',
  tamamlandi: 'done',
}

export function statusLabel(status: WorkItemStatus): string {
  return taskListText(`taskList.status.${status}`)
}

export interface DueNote {
  text: string
  tone: 'danger' | 'faint'
}

/** E-03-25: gecikmiş (sunucu) / kalan (istemci) / tamamlanmış (yok). */
export function dueNote(
  item: Pick<WorkItem, 'status' | 'is_overdue' | 'days_overdue' | 'end_on'>,
  today: string,
): DueNote | null {
  if (item.status === 'tamamlandi') return null
  if (item.is_overdue) {
    return { text: taskListText('taskList.overdue', { n: item.days_overdue }), tone: 'danger' }
  }
  const left = daysBetween(today, item.end_on)
  if (left === null || left < 0) return null
  return { text: taskListText('taskList.remaining', { n: left }), tone: 'faint' }
}

export interface RequestTag {
  label: string
  title: string
}

/** E-03-26: bekleyen talebin yeni bitişi; ipucu eski → yeni (üyede hep `null`). */
export function requestTag(item: Pick<WorkItem, 'end_on' | 'pending_date_request'>) {
  const request = item.pending_date_request
  if (!request) return null
  return {
    label: taskListText('taskList.request', { day: formatShortDay(request.new_end_on) }),
    title: taskListText('taskList.requestTitle', {
      from: formatShortDay(item.end_on),
      to: formatShortDay(request.new_end_on),
    }),
  } satisfies RequestTag
}

/** Atanan adı; `null` → "Bilinmeyen kişi" (G4, istemci-akislari §8). */
export function personName(fullName: string | null | undefined): string {
  const name = fullName?.trim()
  return name ? name : taskListText('taskList.unknownPerson')
}

/** Alt görev düğmesi (E-03-21): `data-has`, `data-done`, etiket "t/n" ya da "+ alt". */
export function subtaskToggle(counts: WorkItem['subtask_counts']) {
  const has = counts.total > 0
  return {
    has,
    done: has && counts.done === counts.total,
    label: has ? `${counts.done}/${counts.total}` : taskListText('taskList.subtasksNone'),
  }
}
