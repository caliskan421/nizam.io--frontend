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
import { redeemAndSave, useDownloadFlow, type DownloadTarget } from '@/shared/download'

import type { ArchiveDownloadRequest, ArchiveDownloadResult } from '../model/types'

/** Bilet hedefinin göreli yolu (kapalı liste: yalnız bu üç arşiv/dosya deseni). */
export function downloadPath(request: ArchiveDownloadRequest): string {
  const id = encodeURIComponent(request.id ?? '')
  if (request.kind === 'file') return `/v1/files/${id}/download`
  if (request.kind === 'folder') return `/v1/records/archive/folders/${id}/download-zip`
  return '/v1/records/archive/period/download-zip'
}

/** Arşiv hedefi: GET + S3 kapsam başlıkları (program + departman). */
function archiveTarget(request: ArchiveDownloadRequest): DownloadTarget {
  return {
    method: 'GET',
    path: downloadPath(request),
    headers: scopeHeaders(request.target),
    fallbackName: request.fallbackName,
  }
}

/**
 * Bileti tüketir ve kaydeder (ortak akış `shared/download`; burada yeniden dışa aktarılır, arşiv
 * çağıranları ve testleri aynı adı kullanır).
 */
export { redeemAndSave }

/** Dosya/ZIP indirme eylemi (düğme başına bir kez çağrılır; bilet tıklama anında üretilir). */
export function useArchiveDownload() {
  const flow = useDownloadFlow<ArchiveDownloadRequest>(archiveTarget)
  const start = (request: ArchiveDownloadRequest): Promise<ArchiveDownloadResult> =>
    flow.start(request)
  return { start, isPending: flow.isPending }
}
