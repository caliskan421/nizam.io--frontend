/**
 * İndirme bileti akışı (ADR-0013; `06-arsiv/backend.md` §2): `issueDownloadTicket` (S1; hedefin
 * S3 başlıkları bilete yazılır) → hemen `redeemDownloadTicket` (S0, 60 sn, tek kullanım).
 * Hedefler: `downloadFile` (tek dosya), `archiveFolderZip`, `archiveFullZip`; seçim ZIP'i
 * kullanılmaz. Bilet önbelleğe/duruma girmez (`gcTime: 0`, her indirmeden sonra `reset`).
 *
 * Hatalar (otomatik tekrar YOK): üretimde 422 `identity.download_target_invalid`, 429
 * `platform.rate_limited` (+ `Retry-After`; oturum başına 16 açık bilet) → `ticket_failed`;
 * tüketimde 404 `identity.download_ticket_invalid` (yeni bilet kullanıcı eylemiyle), hedefin
 * 403/404/422/429 (`records.not_authorized`, `records.file_not_found`, `records.too_many_files`,
 * `records.too_large`, `records.busy`) → `failed` + `retryAfter`. Akış ortasında kopma: gövde
 * okunamazsa `failed` (ağ hatası); bozuk yarım ZIP için ekran "tekrar deneyin" der (GAP-041).
 * Sahip bilet beklerken söküldüyse bilet TÜKETİLMEZ (`disposed`).
 */
import { scopeHeaders } from '@/modules/work/public'
import { ApiError, normalizeErrorResponse, toApiError } from '@/shared/errors/api-error'
import { api } from '@/shared/http'
import { ownerLife, useProtectedMutation } from '@/shared/http/mutation'

import type { ArchiveDownloadRequest, ArchiveDownloadResult, DownloadTicket } from '../model/types'
import { dispositionName, safeFileName, saveBlob, ticketOf } from './save'

/** Bilet hedefinin göreli yolu (kapalı liste: yalnız bu üç arşiv/dosya deseni). */
export function downloadPath(request: ArchiveDownloadRequest): string {
  const id = encodeURIComponent(request.id ?? '')
  if (request.kind === 'file') return `/v1/files/${id}/download`
  if (request.kind === 'folder') return `/v1/records/archive/folders/${id}/download-zip`
  return '/v1/records/archive/period/download-zip'
}

/** Bileti tüketir ve kaydeder; başarısızlık sınıflandırılmış sonuç olarak döner (fırlatmaz). */
export async function redeemAndSave(
  ticketUrl: string,
  fallbackName: string,
  signal?: AbortSignal,
): Promise<ArchiveDownloadResult> {
  const ticket = ticketOf(ticketUrl)
  if (ticket === null) {
    const error = new ApiError({ code: 'client.invalid_response' })
    return { kind: 'failed', error, retryAfter: null }
  }
  try {
    const result = await api.GET('/v1/downloads/{ticket}', {
      params: { path: { ticket } },
      parseAs: 'blob',
      signal,
    })
    if (!result.response.ok) {
      const error = normalizeErrorResponse(result.response, result.error)
      return { kind: 'failed', error, retryAfter: error.retryAfter }
    }
    const name = dispositionName(result.response.headers.get('Content-Disposition'))
    const fileName = safeFileName(name ?? fallbackName, fallbackName)
    saveBlob(result.data as Blob, fileName)
    return { kind: 'saved', fileName }
  } catch (cause) {
    const error = toApiError(cause)
    return { kind: 'failed', error, retryAfter: error.retryAfter }
  }
}

/** Dosya/ZIP indirme eylemi (düğme başına bir kez çağrılır; bilet tıklama anında üretilir). */
export function useArchiveDownload() {
  const ticket = useProtectedMutation<ArchiveDownloadRequest, DownloadTicket>({
    operation: 'issueDownloadTicket',
    gcTime: 0,
    send: (vars, ctx) =>
      api.POST('/v1/download-tickets', {
        params: { header: scopeHeaders(vars.target) },
        body: { method: 'GET', path: downloadPath(vars) },
        signal: ctx.signal,
      }),
  })
  const owner = ownerLife()

  async function start(request: ArchiveDownloadRequest): Promise<ArchiveDownloadResult> {
    const outcome = await ticket.submit(request)
    try {
      if (outcome.kind !== 'success') return { kind: 'ticket_failed', outcome }
      // Sahip söküldü (geç bilet yanıtı): bilet tüketilmez, indirme açılmaz.
      if (!owner.alive()) return { kind: 'disposed' }
      return await redeemAndSave(outcome.data.url, request.fallbackName)
    } finally {
      // Bilet bellekte kalmaz (hata yolunda ve söküm sonrasında da).
      ticket.reset()
    }
  }

  return { start, isPending: ticket.isPending }
}
