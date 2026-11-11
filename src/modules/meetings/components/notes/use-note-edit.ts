import { ref, shallowRef } from 'vue'
import { reachesOwner, useActionContext } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'
import { resolveDraft, useConflictResolver } from '@/shared/ui/conflict'
import { notifyOutcome } from '@/shared/ui/confirm'
import { useUpdateMeetingNote } from '../../api/note-writes'
import type { MeetingNote, MeetingTarget } from '../../model/types'

function validEdit(programId: string | null, content: string) {
  return !!programId && !!content.trim() && Array.from(content).length <= 5000
}

export function useNoteEdit(target: () => MeetingTarget, refresh: () => void) {
  const scope = useScopeStore()
  const update = useUpdateMeetingNote()
  const captureContext = useActionContext()
  const conflict = useConflictResolver()
  const editing = shallowRef<MeetingNote | null>(null)
  const editDraft = ref('')
  async function saveNote() {
    const base = editing.value
    if (!base || !validEdit(scope.programId, editDraft.value)) return
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
    if (!reachesOwner(result)) return
    if (result.kind === 'success') {
      editing.value = null
      refresh()
      return
    }
    if (result.kind !== 'edit_conflict' || !result.server) {
      notifyOutcome(result)
      return
    }
    const server = result.server as MeetingNote
    const choices = await conflict.resolve({
      base: { content: base.content },
      draft: { content },
      server: { content: server.content },
      labels: { content: 'Not' },
    })
    if (!choices) return
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
    if (!reachesOwner(next)) return
    if (next.kind === 'success') {
      editing.value = null
      refresh()
    } else notifyOutcome(next)
  }
  return { update, conflict, editing, editDraft, saveNote }
}
