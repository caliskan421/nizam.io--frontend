import { ref, shallowRef, type Ref } from 'vue'
import { trMeetings } from '@/shared/i18n/tr/meetings'
import { reachesOwner, useActionContext, type MutationOutcome } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'
import { resolveDraft, useConflictResolver } from '@/shared/ui/conflict'
import { notifyOutcome } from '@/shared/ui/confirm'
import { useUpdateMeetingNote } from '../../api/note-writes'
import type { MeetingNote, MeetingTarget } from '../../model/types'

function validEdit(programId: string | null, content: string) {
  return !!programId && !!content.trim() && Array.from(content).length <= 5000
}

function isCurrent(
  result: Parameters<typeof reachesOwner>[0],
  started: number,
  version: () => number,
) {
  return reachesOwner(result) && started === version()
}

function finish(
  result: MutationOutcome<unknown, unknown, unknown>,
  editing: Ref<MeetingNote | null>,
  refresh: () => void,
) {
  if (result.kind === 'success') {
    editing.value = null
    refresh()
  } else notifyOutcome(result)
}

export function useNoteEdit(
  target: () => MeetingTarget,
  version: () => number,
  refresh: () => void,
) {
  const scope = useScopeStore()
  const update = useUpdateMeetingNote()
  const captureContext = useActionContext()
  const conflict = useConflictResolver()
  const editing = shallowRef<MeetingNote | null>(null)
  const editDraft = ref('')
  async function saveNote() {
    const base = editing.value
    if (!base || !validEdit(scope.programId, editDraft.value)) return
    const started = version()
    const context = captureContext()
    const content = editDraft.value
    const result = await update.submit(
      {
        ...target(),
        noteId: base.note_id,
        body: { content, expected_revision: base.edit_revision },
      },
      { context },
    )
    if (!isCurrent(result, started, version)) return
    if (result.kind === 'success') return finish(result, editing, refresh)
    if (result.kind !== 'edit_conflict' || !result.server) {
      notifyOutcome(result)
      return
    }
    const server = result.server as MeetingNote
    const choices = await conflict.resolve({
      base: { content: base.content },
      draft: { content },
      server: { content: server.content },
      labels: { content: trMeetings.meetings.notes.field },
    })
    if (!choices) return
    if (started !== version()) return
    const changes = resolveDraft({ content }, { content: server.content }, choices)
    if (changes.content === undefined) {
      editing.value = null
      return
    }
    const next = await update.submit(
      {
        ...target(),
        noteId: base.note_id,
        body: { content: changes.content, expected_revision: server.edit_revision },
      },
      { context },
    )
    if (!isCurrent(next, started, version)) return
    finish(next, editing, refresh)
  }
  return { update, conflict, editing, editDraft, saveNote }
}
