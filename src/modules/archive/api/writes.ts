/**
 * Arşiv yazmaları (`useProtectedMutation` ailesi; K5, `ortak-kurallar.md` §7). Hepsi S3: kapsam
 * başlıkları DOSYANIN/GÖREVİN departmanıdır (`target`; yöneticide rotadaki klasör). İyimser
 * güncelleme yok; başarıda `archive` (programın bütün departman anahtarları), görevin
 * `listWorkItemFiles` ve görev ayrıntısı yeniden okunur (`query-keys.ts` ilişki listesi).
 *
 *  - `attachFile`: multipart `file`, `tag` zorunlu enum, isteğe bağlı `subtask_id`;
 *    `Idempotency-Key` eylem başına, belirsizlikte aynı anahtarla TEK izinli tekrar.
 *  - `renameFile`: anahtarsız, `expected_revision` yok (son yazan kazanır); sonuç bilinmiyorsa
 *    kör tekrar yok → liste yeniden okunur. 409 `records.name_taken` / `records.moved`, 422
 *    `records.name_invalid`; `records.moved` yeniden okutur.
 *  - `deleteFile`: 204, kalıcı (onay çağıranda); 404 `records.file_not_found` → silinmiş say,
 *    liste yenilenir (sonuç `failed` kalır, çağıran `fileGone` ile ayırt eder).
 */
import { useQueryClient } from '@tanstack/vue-query'

import { useKeylessMutation } from '@/modules/organization/public'
import { scopeHeaders } from '@/modules/work/public'
import { api } from '@/shared/http'
import {
  markDetached,
  ownerLife,
  type MutationOutcome,
  type ProtectedMutation,
  type SubmitOptions,
} from '@/shared/http/mutation'
import { invalidationFilters, type OperationId } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'

import type {
  ArchiveFileRef,
  AttachArchiveFileInput,
  AttachFileForm,
  FileRecord,
  RenameArchiveFileInput,
} from '../model/types'
import { useSingleRetryMutation } from './keyed'

const byItem = (vars: ArchiveFileRef | AttachArchiveFileInput) => ({ workItemId: vars.workItemId })

/** Çok parçalı gövde (her gönderimde dondurulmuş değişkenden yeniden kurulur). */
export function archiveFileForm(vars: AttachArchiveFileInput): FormData {
  const form = new FormData()
  const name = vars.fileName ?? (vars.file instanceof File ? vars.file.name : 'dosya')
  form.append('file', vars.file, name)
  return form
}

/** `attachFile` — görev seçerek yükle (P35); başlık = görevin program/departmanı. */
export function useAttachArchiveFile() {
  return useSingleRetryMutation<AttachArchiveFileInput, FileRecord>({
    operation: 'attachFile',
    send: (vars, ctx) =>
      api.POST('/v1/work-items/{id}/files', {
        params: {
          header: { 'Idempotency-Key': ctx.idempotencyKey, ...scopeHeaders(vars.target) },
          path: { id: vars.workItemId },
          query: { tag: vars.tag, ...(vars.subtaskId ? { subtask_id: vars.subtaskId } : {}) },
        },
        body: archiveFileForm(vars) as unknown as AttachFileForm,
        signal: ctx.signal,
      }),
    invalidation: byItem,
  })
}

/** Koda göre başarısızlıkta ortak yeniden okuma (sahibi yaşıyorsa). */
function rereadOnCodes<V extends ArchiveFileRef, D>(
  mutation: ProtectedMutation<V, D, unknown>,
  operation: OperationId,
  codes: ReadonlySet<string>,
): ProtectedMutation<V, D, unknown> {
  const queryClient = useQueryClient()
  const store = useScopeStore()
  const owner = ownerLife()
  async function submit(vars: V, opts?: SubmitOptions): Promise<MutationOutcome<V, D, unknown>> {
    const scope = { ...(opts?.context?.scope ?? store.snapshot) }
    const outcome = await mutation.submit(vars, opts)
    if (outcome.kind === 'failed' && codes.has(outcome.error.code) && owner.alive()) {
      const filters = invalidationFilters(operation, scope, { workItemId: vars.workItemId })
      await Promise.all(filters.map((filter) => queryClient.invalidateQueries(filter)))
    }
    return owner.alive() ? outcome : markDetached(outcome)
  }
  return { ...mutation, submit }
}

const RENAME_REREAD = new Set(['records.moved', 'records.file_not_found'])
const DELETE_REREAD = new Set(['records.moved', 'records.file_not_found'])

/** `renameFile` — anahtarsız; 409 `records.name_taken` alanın altında gösterilir. */
export function useRenameArchiveFile() {
  const mutation = useKeylessMutation<RenameArchiveFileInput, FileRecord>({
    operation: 'renameFile',
    send: (vars, ctx) =>
      api.PATCH('/v1/files/{id}/name', {
        params: { header: scopeHeaders(vars.target), path: { id: vars.fileId } },
        body: { display_name: vars.displayName },
        signal: ctx.signal,
      }),
    invalidation: byItem,
  })
  return rereadOnCodes(mutation, 'renameFile', RENAME_REREAD)
}

/** `deleteFile` — kalıcı silme (geri alma yok); onay çağıranda (`confirmWrite`). */
export function useDeleteArchiveFile() {
  const mutation = useKeylessMutation<ArchiveFileRef, unknown>({
    operation: 'deleteFile',
    send: (vars, ctx) =>
      api.DELETE('/v1/files/{id}', {
        params: { header: scopeHeaders(vars.target), path: { id: vars.fileId } },
        signal: ctx.signal,
      }),
    invalidation: byItem,
  })
  return rereadOnCodes(mutation, 'deleteFile', DELETE_REREAD)
}

/** Silme sonucu "dosya zaten yok" mu (404 `records.file_not_found` → silinmiş say). */
export function fileGone(outcome: MutationOutcome<ArchiveFileRef, unknown, unknown>): boolean {
  return outcome.kind === 'failed' && outcome.error.code === 'records.file_not_found'
}
