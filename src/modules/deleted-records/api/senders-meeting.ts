/**
 * Toplantı notu ve gündem maddesi yaşam döngüsü yazmaları (v0.26; ADR-0045/0054): tekil geri yükle / kalıcı sil, toplu
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
  AgendaItemLifecycleResult,
  AgendaItemPurgeResult,
  MeetingNoteLifecycleResult,
  MeetingNotePurgeResult,
  ProgramRecordTarget,
  PurgeAllTarget,
} from '../model/types'

export function useMeetingNoteLifecycle() {
  return {
    restore: useKeylessMutation<ProgramRecordTarget, MeetingNoteLifecycleResult>({
      operation: 'restoreMeetingNote',
      send: (v, ctx) =>
        api.PATCH('/v1/admin/restore/meeting-notes/{id}', {
          params: { header: programHeaders(v), path: { id: v.id } },
          signal: ctx.signal,
        }),
    }),
    purge: useKeylessMutation<ProgramRecordTarget, MeetingNotePurgeResult>({
      operation: 'permanentDeleteMeetingNote',
      send: (v, ctx) =>
        api.DELETE('/v1/admin/permanent/meeting-notes/{id}', {
          params: { header: programHeaders(v), path: { id: v.id } },
          signal: ctx.signal,
        }),
    }),
    batchRestore: useKeylessMutation<BatchTarget, DeletedBatchResult>({
      operation: 'batchRestoreMeetingNotes',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/meeting-notes/restore', {
          params: { header: programHeaders(v) },
          body: { ids: v.ids },
          signal: ctx.signal,
        }),
    }),
    batchPurge: useKeylessMutation<BatchTarget, DeletedBatchResult>({
      operation: 'batchPurgeMeetingNotes',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/meeting-notes/purge', {
          params: { header: programHeaders(v) },
          body: { ids: v.ids },
          signal: ctx.signal,
        }),
    }),
    purgeAll: useKeylessMutation<PurgeAllTarget, DeletedBatchResult>({
      operation: 'purgeAllMeetingNotes',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/meeting-notes/purge-all', {
          params: { header: programHeaders(v) },
          body: { confirm: v.confirm },
          signal: ctx.signal,
        }),
    }),
  }
}

export function useAgendaItemLifecycle() {
  return {
    restore: useKeylessMutation<ProgramRecordTarget, AgendaItemLifecycleResult>({
      operation: 'restoreAgendaItem',
      send: (v, ctx) =>
        api.PATCH('/v1/admin/restore/agenda-items/{id}', {
          params: { header: programHeaders(v), path: { id: v.id } },
          signal: ctx.signal,
        }),
    }),
    purge: useKeylessMutation<ProgramRecordTarget, AgendaItemPurgeResult>({
      operation: 'permanentDeleteAgendaItem',
      send: (v, ctx) =>
        api.DELETE('/v1/admin/permanent/agenda-items/{id}', {
          params: { header: programHeaders(v), path: { id: v.id } },
          signal: ctx.signal,
        }),
    }),
    batchRestore: useKeylessMutation<BatchTarget, DeletedBatchResult>({
      operation: 'batchRestoreAgendaItems',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/agenda-items/restore', {
          params: { header: programHeaders(v) },
          body: { ids: v.ids },
          signal: ctx.signal,
        }),
    }),
    batchPurge: useKeylessMutation<BatchTarget, DeletedBatchResult>({
      operation: 'batchPurgeAgendaItems',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/agenda-items/purge', {
          params: { header: programHeaders(v) },
          body: { ids: v.ids },
          signal: ctx.signal,
        }),
    }),
    purgeAll: useKeylessMutation<PurgeAllTarget, DeletedBatchResult>({
      operation: 'purgeAllAgendaItems',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/agenda-items/purge-all', {
          params: { header: programHeaders(v) },
          body: { confirm: v.confirm },
          signal: ctx.signal,
        }),
    }),
  }
}
