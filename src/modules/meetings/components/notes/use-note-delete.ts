import { trMeetings } from '@/shared/i18n/tr/meetings'
import { reachesOwner } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'
import { useDeleteMeetingNote } from '../../api/note-writes'
import type { MeetingNote, MeetingTarget } from '../../model/types'

export function useNoteDelete(
  target: () => MeetingTarget,
  version: () => number,
  refresh: () => void,
  focus: () => void,
) {
  const scope = useScopeStore()
  const remove = useDeleteMeetingNote()
  const { confirmWrite } = useConfirm()
  return async (note: MeetingNote) => {
    if (!scope.programId) return
    const started = version()
    const text = trMeetings.meetings.notes
    const result = await confirmWrite(
      {
        title: text.deleteTitle,
        body: [text.deleteBody],
        confirmLabel: text.delete,
        tone: 'danger',
      },
      (context) => remove.submit({ ...target(), noteId: note.note_id }, { context }),
    )
    if (!result || !reachesOwner(result) || started !== version()) return
    if (result.kind === 'success') {
      refresh()
      focus()
    } else notifyOutcome(result)
  }
}
