/**
 * Alt görev yazmaları (03 `backend.md` §2; ADR-0024: tarih yalnız bilgi, kanıt/zorunluluk
 * bayrağı yok — BE-006). `useProtectedMutation`; iyimser güncelleme yok: `done` isteği
 * sürerken çağıran bekleme durumunu gösterir, başarıda alt görevler + görev + liste yeniden
 * okunur (E-03-31).
 */
import { api } from '@/shared/http'
import {
  SUBTASK_REVISION_GROUPS,
  useProtectedMutation,
  withExpectedRevisions,
} from '@/shared/http/mutation'

import type {
  CreateSubtaskInput,
  StatusResult,
  SubtaskRef,
  UpdateSubtaskInput,
  WorkItemSubtask,
  WorkItemRef,
} from '../model/types'
import { fetchSubtasks } from './fetchers'
import { scopeHeaders } from './http'

const byItem = (vars: WorkItemRef) => ({ workItemId: vars.workItemId })

/** `createWorkItemSubtask` — IK Enter/Ekle başına; 409 `work.subtask_limit_reached` (50). */
export function useCreateSubtask() {
  return useProtectedMutation<CreateSubtaskInput, WorkItemSubtask>({
    operation: 'createWorkItemSubtask',
    send: (vars, ctx) =>
      api.POST('/v1/work-items/{id}/subtasks', {
        params: {
          header: { ...ctx.headers, ...scopeHeaders(vars.target) },
          path: { id: vars.workItemId },
        },
        body: vars.body,
        signal: ctx.signal,
      }),
    invalidation: byItem,
  })
}

/** Sunucunun güncel alt görevi (çakışmada alan alan seçim için). */
async function currentSubtask(vars: UpdateSubtaskInput): Promise<WorkItemSubtask | null> {
  const list = await fetchSubtasks(vars.target, vars.workItemId)
  return list.subtasks.find((s) => s.subtask_id === vars.base.subtask_id) ?? null
}

/**
 * `updateWorkItemSubtask`: yalnız `{done}` gönderilirse sürüm eklenmez; başlık / atanan /
 * tarih gruptan alan içeriyorsa `expected_revision` = alt görevin `edit_revision`'ı.
 * Atanan yalnız ana göreve atanmışlardan (422 `work.subtask_assignee_not_assigned`); boş dize
 * atananı ya da tarihleri kaldırır. 409 `work.edit_conflict` → güncel alt görev `server`'da.
 */
export function useUpdateSubtask() {
  return useProtectedMutation<UpdateSubtaskInput, WorkItemSubtask, WorkItemSubtask | null>({
    operation: 'updateWorkItemSubtask',
    send: (vars, ctx) =>
      api.PATCH('/v1/work-items/{id}/subtasks/{subtaskId}', {
        params: {
          header: scopeHeaders(vars.target),
          path: { id: vars.workItemId, subtaskId: vars.base.subtask_id },
        },
        body: withExpectedRevisions(vars.changes, vars.base, SUBTASK_REVISION_GROUPS),
        signal: ctx.signal,
      }),
    readCurrent: currentSubtask,
    invalidation: byItem,
  })
}

/** `deleteWorkItemSubtask` — istemci onayı (E-03-36/64); bağlı dosyaların `subtask_id`'si boşalır. */
export function useDeleteSubtask() {
  return useProtectedMutation<SubtaskRef, StatusResult>({
    operation: 'deleteWorkItemSubtask',
    send: (vars, ctx) =>
      api.DELETE('/v1/work-items/{id}/subtasks/{subtaskId}', {
        params: {
          header: scopeHeaders(vars.target),
          path: { id: vars.workItemId, subtaskId: vars.subtaskId },
        },
        signal: ctx.signal,
      }),
    invalidation: byItem,
  })
}
