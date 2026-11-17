/**
 * Yeni beş çocuk türün yaşam döngüsü yazmaları tek yüzde (W193 tüketir): her tür için
 * `restore | purge | batchRestore | batchPurge | purgeAll`. Üç `senders-*` dosyasındaki
 * kurulum-zamanı hook'larını toplar; render ya da olay içinde çağrılmaz.
 */
import { useFileLifecycle } from './senders-file'
import { useAgendaItemLifecycle, useMeetingNoteLifecycle } from './senders-meeting'
import { useSubtaskLifecycle, useTaskNoteLifecycle } from './senders-work'

export function useChildLifecycleWrites() {
  return {
    files: useFileLifecycle(),
    subtasks: useSubtaskLifecycle(),
    task_notes: useTaskNoteLifecycle(),
    meeting_notes: useMeetingNoteLifecycle(),
    agenda_items: useAgendaItemLifecycle(),
  }
}
