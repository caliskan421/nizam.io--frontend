/**
 * Görev notları (03 `backend.md` §2; E-03-62). Yazma s.144 (yönetici her durumda reddedilir),
 * düzenle/sil yalnız yazarı (s.145). `addWorkItemNote` IK zorunlu; düzenleme
 * `expected_revision` (not `edit_revision`), 409 `work.edit_conflict` → güncel not `server`'da.
 */
import { api } from '@/shared/http'
import { useProtectedMutation } from '@/shared/http/mutation'

import type {
  AddNoteInput,
  NoteRef,
  StatusResult,
  UpdateNoteInput,
  WorkItemNote,
  WorkItemRef,
  WorkNoteUpdated,
} from '../model/types'
import { fetchNotes } from './fetchers'
import { scopeHeaders } from './http'

const byItem = (vars: WorkItemRef) => ({ workItemId: vars.workItemId })

/** `addWorkItemNote` — 429 hesap başına hız sınırı (`Retry-After`, otomatik tekrar yok). */
export function useAddNote() {
  return useProtectedMutation<AddNoteInput, WorkItemNote>({
    operation: 'addWorkItemNote',
    send: (vars, ctx) =>
      api.POST('/v1/work-items/{id}/notes', {
        params: {
          header: { ...ctx.headers, ...scopeHeaders(vars.target) },
          path: { id: vars.workItemId },
        },
        body: { content: vars.content },
        signal: ctx.signal,
      }),
    invalidation: byItem,
  })
}

async function currentNote(vars: UpdateNoteInput): Promise<WorkItemNote | null> {
  const list = await fetchNotes(vars.target, vars.workItemId)
  return list.notes.find((n) => n.note_id === vars.noteId) ?? null
}

/** `updateWorkItemNote` — yanıt `{status:"updated", edit_revision}`. */
export function useUpdateNote() {
  return useProtectedMutation<UpdateNoteInput, WorkNoteUpdated, WorkItemNote | null>({
    operation: 'updateWorkItemNote',
    send: (vars, ctx) =>
      api.PATCH('/v1/work-items/{id}/notes/{noteId}', {
        params: {
          header: scopeHeaders(vars.target),
          path: { id: vars.workItemId, noteId: vars.noteId },
        },
        // `expected_revision` her düzenlemede zorunlu (NOTE_REVISION_GROUPS: tek grup `content`).
        body: { content: vars.content, expected_revision: vars.base.edit_revision },
        signal: ctx.signal,
      }),
    readCurrent: currentNote,
    invalidation: byItem,
  })
}

/** `deleteWorkItemNote` — yalnız yazarı; onay istemci diyaloğunda. */
export function useDeleteNote() {
  return useProtectedMutation<NoteRef, StatusResult>({
    operation: 'deleteWorkItemNote',
    send: (vars, ctx) =>
      api.DELETE('/v1/work-items/{id}/notes/{noteId}', {
        params: {
          header: scopeHeaders(vars.target),
          path: { id: vars.workItemId, noteId: vars.noteId },
        },
        signal: ctx.signal,
      }),
    invalidation: byItem,
  })
}
