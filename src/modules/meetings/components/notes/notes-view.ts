import { nextTick } from 'vue'
import type { MeetingNote } from '../../model/types'
export function noteCount(count: number, hasMore: boolean): string {
  return `${count}${hasMore ? '+' : ''}`
}
export function noteTime(value: string, timeZone?: string | null): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: timeZone ?? 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
export function noteFacts(note: MeetingNote) {
  return {
    authorAccountId: note.author_account_id,
    authorRole: note.author_role,
    converted: !!note.converted_to_work_item_id,
  }
}

export function noteFocus() {
  const buttons = new Map<string, HTMLButtonElement>()
  return {
    focus: (id: string) => {
      void nextTick(() =>
        (
          buttons.get(id) ??
          document.querySelector<HTMLElement>('[data-testid="meeting-notes-title"]')
        )?.focus(),
      )
    },
    bind: (id: string, el: unknown) => {
      if (el instanceof HTMLButtonElement) buttons.set(id, el)
      else buttons.delete(id)
    },
  }
}

export function selectNotes(
  notes: readonly MeetingNote[],
  filter: 'all' | 'converted' | 'mine',
  accountId?: string,
): MeetingNote[] {
  return notes.filter(
    (note) =>
      filter === 'all' ||
      (filter === 'converted'
        ? !!note.converted_to_work_item_id
        : !!accountId && note.author_account_id === accountId),
  )
}
