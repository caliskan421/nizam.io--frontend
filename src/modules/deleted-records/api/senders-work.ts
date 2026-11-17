/**
 * Alt görev ve görev notu yaşam döngüsü yazmaları (v0.26; ADR-0045/0054): tekil geri yükle / kalıcı sil, toplu
 * geri yükle / kalıcı sil (≤100 kimlik) ve çöpü boşalt (`confirm` = yol adı, çağrı başına ≤50).
 * S2: program başlığı eylemle dondurulur; CSRF ortak istemcide. İşlem anahtarı, `expected_revision`
 * ve iyimser güncelleme YOK: anahtarsız yazma kalıbı (`useKeylessMutation`) — sonuç bilinmiyorsa
 * kör tekrar yok, listeler yeniden okunur. Hook'lar kurulumda (setup) çağrılır.
 */
import { useKeylessMutation } from '@/modules/organization/public'
import { programHeaders } from '@/modules/work/public'
import { api } from '@/shared/http'

import type {
  BatchTarget,
  DeletedBatchResult,
  SubtaskLifecycleResult,
  SubtaskPurgeResult,
  TaskNoteLifecycleResult,
  TaskNotePurgeResult,
  ProgramRecordTarget,
  PurgeAllTarget,
} from '../model/types'

export function useSubtaskLifecycle() {
  return {
    restore: useKeylessMutation<ProgramRecordTarget, SubtaskLifecycleResult>({
      operation: 'restoreSubtask',
      send: (v, ctx) =>
        api.PATCH('/v1/admin/restore/subtasks/{id}', {
          params: { header: programHeaders(v), path: { id: v.id } },
          signal: ctx.signal,
        }),
    }),
    purge: useKeylessMutation<ProgramRecordTarget, SubtaskPurgeResult>({
      operation: 'permanentDeleteSubtask',
      send: (v, ctx) =>
        api.DELETE('/v1/admin/permanent/subtasks/{id}', {
          params: { header: programHeaders(v), path: { id: v.id } },
          signal: ctx.signal,
        }),
    }),
    batchRestore: useKeylessMutation<BatchTarget, DeletedBatchResult>({
      operation: 'batchRestoreSubtasks',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/subtasks/restore', {
          params: { header: programHeaders(v) },
          body: { ids: v.ids },
          signal: ctx.signal,
        }),
    }),
    batchPurge: useKeylessMutation<BatchTarget, DeletedBatchResult>({
      operation: 'batchPurgeSubtasks',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/subtasks/purge', {
          params: { header: programHeaders(v) },
          body: { ids: v.ids },
          signal: ctx.signal,
        }),
    }),
    purgeAll: useKeylessMutation<PurgeAllTarget, DeletedBatchResult>({
      operation: 'purgeAllSubtasks',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/subtasks/purge-all', {
          params: { header: programHeaders(v) },
          body: { confirm: v.confirm },
          signal: ctx.signal,
        }),
    }),
  }
}

export function useTaskNoteLifecycle() {
  return {
    restore: useKeylessMutation<ProgramRecordTarget, TaskNoteLifecycleResult>({
      operation: 'restoreTaskNote',
      send: (v, ctx) =>
        api.PATCH('/v1/admin/restore/task-notes/{id}', {
          params: { header: programHeaders(v), path: { id: v.id } },
          signal: ctx.signal,
        }),
    }),
    purge: useKeylessMutation<ProgramRecordTarget, TaskNotePurgeResult>({
      operation: 'permanentDeleteTaskNote',
      send: (v, ctx) =>
        api.DELETE('/v1/admin/permanent/task-notes/{id}', {
          params: { header: programHeaders(v), path: { id: v.id } },
          signal: ctx.signal,
        }),
    }),
    batchRestore: useKeylessMutation<BatchTarget, DeletedBatchResult>({
      operation: 'batchRestoreTaskNotes',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/task-notes/restore', {
          params: { header: programHeaders(v) },
          body: { ids: v.ids },
          signal: ctx.signal,
        }),
    }),
    batchPurge: useKeylessMutation<BatchTarget, DeletedBatchResult>({
      operation: 'batchPurgeTaskNotes',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/task-notes/purge', {
          params: { header: programHeaders(v) },
          body: { ids: v.ids },
          signal: ctx.signal,
        }),
    }),
    purgeAll: useKeylessMutation<PurgeAllTarget, DeletedBatchResult>({
      operation: 'purgeAllTaskNotes',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/task-notes/purge-all', {
          params: { header: programHeaders(v) },
          body: { confirm: v.confirm },
          signal: ctx.signal,
        }),
    }),
  }
}
