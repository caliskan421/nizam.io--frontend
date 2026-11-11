import { nextTick, onScopeDispose, type Ref } from 'vue'
import type { MeetingNote } from '../../model/types'
import { useScopeStore } from '@/shared/scope/store'
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

export function noteFocus(root: Ref<HTMLElement | null>, version: () => number) {
  const buttons = new Map<string, HTMLButtonElement>()
  let alive = true
  let scopeVersion = 0
  const offScope = useScopeStore().onChange(() => {
    scopeVersion += 1
  })
  onScopeDispose(() => {
    alive = false
    offScope()
  })
  function schedule(id?: string) {
    const started = version()
    const scopeStarted = scopeVersion
    void nextTick(() => {
      const section = root.value
      if (!alive || started !== version() || scopeStarted !== scopeVersion || !section?.isConnected)
        return
      const button = id ? buttons.get(id) : undefined
      const target = button?.isConnected
        ? button
        : section.querySelector<HTMLElement>('[data-testid="meeting-notes-title"]')
      target?.focus()
    })
  }
  return {
    heading: () => schedule(),
    focus: (id: string) => schedule(id),
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
