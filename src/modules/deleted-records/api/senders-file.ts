/**
 * Dosya çöp kutusu yaşam döngüsü yazmaları (v0.26; ADR-0045/0053): tekil geri yükle / kalıcı sil, toplu
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
  FilePurgeResult,
  FileRestoreResult,
  ProgramRecordTarget,
  PurgeAllTarget,
} from '../model/types'

export function useFileLifecycle() {
  return {
    restore: useKeylessMutation<ProgramRecordTarget, FileRestoreResult>({
      operation: 'restoreFile',
      send: (v, ctx) =>
        api.PATCH('/v1/admin/restore/files/{id}', {
          params: { header: programHeaders(v), path: { id: v.id } },
          signal: ctx.signal,
        }),
    }),
    purge: useKeylessMutation<ProgramRecordTarget, FilePurgeResult>({
      operation: 'permanentDeleteFile',
      send: (v, ctx) =>
        api.DELETE('/v1/admin/permanent/files/{id}', {
          params: { header: programHeaders(v), path: { id: v.id } },
          signal: ctx.signal,
        }),
    }),
    batchRestore: useKeylessMutation<BatchTarget, DeletedBatchResult>({
      operation: 'batchRestoreFiles',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/files/restore', {
          params: { header: programHeaders(v) },
          body: { ids: v.ids },
          signal: ctx.signal,
        }),
    }),
    batchPurge: useKeylessMutation<BatchTarget, DeletedBatchResult>({
      operation: 'batchPurgeFiles',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/files/purge', {
          params: { header: programHeaders(v) },
          body: { ids: v.ids },
          signal: ctx.signal,
        }),
    }),
    purgeAll: useKeylessMutation<PurgeAllTarget, DeletedBatchResult>({
      operation: 'purgeAllFiles',
      send: (v, ctx) =>
        api.POST('/v1/admin/deleted/files/purge-all', {
          params: { header: programHeaders(v) },
          body: { confirm: v.confirm },
          signal: ctx.signal,
        }),
    }),
  }
}
