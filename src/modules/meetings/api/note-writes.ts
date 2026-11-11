import { useQueryClient } from '@tanstack/vue-query'
import { useKeylessMutation } from '@/modules/organization/public'
import { programHeaders } from '@/modules/work/public'
import { api } from '@/shared/http'
import {
  isDetached,
  markDetached,
  ownerLife,
  useProtectedMutation,
  type SubmitOptions,
} from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import { sessionBound } from '@/shared/session/query-session'
import { useScopeStore } from '@/shared/scope/store'
import { fetchMeetingNotes } from './fetchers'
import type {
  AddNoteInput,
  ConvertNoteInput,
  MeetingNote,
  NoteConverted,
  NoteTarget,
  UpdateNoteInput,
} from '../model/types'

/** Not ekleme anahtarı eyleme bağlı; belirsizlikte aynı anahtarla en çok bir tekrar. */
export function useAddMeetingNote() {
  const client = useQueryClient()
  const store = useScopeStore()
  const owner = ownerLife()
  const mutation = useProtectedMutation<AddNoteInput, MeetingNote, unknown>({
    operation: 'addMeetingNote',
    send: (vars, ctx) =>
      api.POST('/v1/meetings/{id}/notes', {
        params: { header: { ...programHeaders(vars), ...ctx.headers }, path: { id: vars.id } },
        body: vars.body,
        signal: ctx.signal,
      }),
  })
  async function submit(vars: AddNoteInput, options?: SubmitOptions) {
    const scope = { ...(options?.context?.scope ?? store.snapshot) }
    let outcome = await mutation.submit(vars, options)
    if (outcome.kind === 'unknown_outcome' && outcome.retry && !isDetached(outcome))
      outcome = await outcome.retry()
    if (outcome.kind === 'unknown_outcome') {
      await client.invalidateQueries({ queryKey: queryKeys.meetings.all(scope) })
      const next = { ...outcome, retry: null }
      outcome = isDetached(outcome) ? markDetached(next) : next
    }
    return owner.alive() ? outcome : markDetached(outcome)
  }
  return { ...mutation, submit }
}
export function useUpdateMeetingNote() {
  const owner = ownerLife()
  const store = useScopeStore()
  async function readCurrent(vars: UpdateNoteInput) {
    const controller = new AbortController()
    const seen = new Set<string>()
    let cursor: string | undefined
    do {
      if (!owner.alive() || store.snapshot.programId !== vars.programId) return null
      const page = await sessionBound(({ signal }) =>
        fetchMeetingNotes(vars.programId, vars.id, cursor, signal),
      )({ signal: controller.signal })
      const note = page.items.find((item) => item.note_id === vars.noteId)
      if (note) return note
      cursor = page.next_cursor || undefined
      if (cursor && seen.has(cursor)) return null
      if (cursor) seen.add(cursor)
    } while (cursor)
    return null
  }
  return useKeylessMutation<UpdateNoteInput, MeetingNote>({
    operation: 'updateMeetingNote',
    readCurrent,
    send: (vars, ctx) =>
      api.PATCH('/v1/meeting-notes/{noteId}', {
        params: { header: programHeaders(vars), path: { noteId: vars.noteId } },
        body: vars.body,
        signal: ctx.signal,
      }),
  })
}
export function useDeleteMeetingNote() {
  return useKeylessMutation<NoteTarget, void>({
    operation: 'deleteMeetingNote',
    send: (vars, ctx) =>
      api.DELETE('/v1/meeting-notes/{noteId}', {
        params: { header: programHeaders(vars), path: { noteId: vars.noteId } },
        signal: ctx.signal,
      }),
  })
}
export function useConvertNoteToTask() {
  return useKeylessMutation<ConvertNoteInput, NoteConverted>({
    operation: 'convertNoteToTask',
    send: (vars, ctx) =>
      api.POST('/v1/meeting-notes/{noteId}/convert-to-task', {
        params: { header: programHeaders(vars), path: { noteId: vars.noteId } },
        body: vars.body,
        signal: ctx.signal,
      }),
  })
}
