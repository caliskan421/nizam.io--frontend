/**
 * Görev dosyaları (03 `backend.md` §1–§2; ADR-0013). Yükleme doğrudan `multipart/form-data`
 * (`attachFile`; bilet akışı yok), `tag` kapalı kümeden zorunlu (P5), isteğe bağlı
 * `subtask_id`; IK zorunlu. Yükleme görev durumunu DEĞİŞTİRMEZ. İndirme bileti: kapsam
 * başlıkları bilete yazılır, bilet 60 sn / tek kullanım; bilet ve URL saklanmaz.
 */
import { api } from '@/shared/http'
import { useProtectedMutation } from '@/shared/http/mutation'

import type {
  AttachFileForm,
  AttachFileInput,
  DownloadTicket,
  FileRecord,
  FileRef,
  RenameFileInput,
  WorkItemRef,
} from '../model/types'
import { scopeHeaders } from './http'

const byItem = (vars: WorkItemRef) => ({ workItemId: vars.workItemId })

/** Çok parçalı gövde (her gönderimde dondurulmuş değişkenden yeniden kurulur). */
export function attachFileForm(vars: AttachFileInput): FormData {
  const form = new FormData()
  const name = vars.fileName ?? (vars.file instanceof File ? vars.file.name : 'dosya')
  form.append('file', vars.file, name)
  return form
}

/** `attachFile` — kanıt / dosya yükle (s.148; yönetici gizli). */
export function useAttachFile() {
  return useProtectedMutation<AttachFileInput, FileRecord>({
    operation: 'attachFile',
    send: (vars, ctx) =>
      api.POST('/v1/work-items/{id}/files', {
        params: {
          header: { 'Idempotency-Key': ctx.idempotencyKey, ...scopeHeaders(vars.target) },
          path: { id: vars.workItemId },
          query: { tag: vars.tag, ...(vars.subtaskId ? { subtask_id: vars.subtaskId } : {}) },
        },
        body: attachFileForm(vars) as unknown as AttachFileForm,
        signal: ctx.signal,
      }),
    invalidation: byItem,
  })
}

/** `renameFile` (s.149) — 409 `records.name_taken`. */
export function useRenameFile() {
  return useProtectedMutation<RenameFileInput, FileRecord>({
    operation: 'renameFile',
    send: (vars, ctx) =>
      api.PATCH('/v1/files/{id}/name', {
        params: { header: scopeHeaders(vars.target), path: { id: vars.fileId } },
        body: { display_name: vars.displayName },
        signal: ctx.signal,
      }),
    invalidation: byItem,
  })
}

/** `deleteFile` (s.150; yalnız yükleyen) — kalıcı, onay istemci diyaloğunda. */
export function useDeleteFile() {
  return useProtectedMutation<FileRef, unknown>({
    operation: 'deleteFile',
    send: (vars, ctx) =>
      api.DELETE('/v1/files/{id}', {
        params: { header: scopeHeaders(vars.target), path: { id: vars.fileId } },
        signal: ctx.signal,
      }),
    invalidation: byItem,
  })
}

/**
 * `issueDownloadTicket` (S1; görevin kapsamı bilete yazılır) → `{ticket, url, expires_at}`.
 * Çağıran `url`'i hemen açar (`redeemDownloadTicket`, S0); bilet saklanmaz. Sunucu kaydını
 * değiştirmez: geçersizleme yok.
 */
export function useDownloadTicket() {
  return useProtectedMutation<FileRef, DownloadTicket>({
    operation: 'issueDownloadTicket',
    send: (vars, ctx) =>
      api.POST('/v1/download-tickets', {
        params: { header: scopeHeaders(vars.target) },
        body: { method: 'GET', path: `/v1/files/${encodeURIComponent(vars.fileId)}/download` },
        signal: ctx.signal,
      }),
  })
}
