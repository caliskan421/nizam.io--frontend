/**
 * Arşiv okuma uçları (06 `backend.md` §1). Hepsi S3: kapsam başlıkları İSTEĞE ÖZELDİR (`target`;
 * yöneticide departman rotadaki klasördür — `model/admin-scope.ts`), HTTP ara katmanı açık
 * başlığı depo kapsamının önüne koyar. Başlıksız (hedefsiz) istek atılmaz: çağıranlar hedefi
 * `null` iken sorguyu etkinleştirmez.
 */
import { scopeHeaders } from '@/modules/work/public'
import { api, unwrap } from '@/shared/http'

import { toQuery } from '../model/filters'
import type { ArchiveFileFilters, ArchiveTarget } from '../model/types'

/** `archiveFolders` — klasör özeti (dizi, imleçsiz). */
export function fetchArchiveFolders(target: ArchiveTarget, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/records/archive/folders', { params: { header: scopeHeaders(target) }, signal }),
  )
}

/** `archiveTasks` — dosyası olan görevler (dizi, imleçsiz). */
export function fetchArchiveTasks(target: ArchiveTarget, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/records/archive/tasks', { params: { header: scopeHeaders(target) }, signal }),
  )
}

/** `archiveAttachments` — bir sayfa (imleçli; toplam sayı yok, BE-073). */
export function fetchArchiveAttachments(
  target: ArchiveTarget,
  filters: ArchiveFileFilters,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/records/archive/attachments', {
      params: { header: scopeHeaders(target), query: toQuery(filters, cursor) },
      signal,
    }),
  )
}

/** `archiveUploaders` — yükleyen hesap kimlikleri (ad yok, BE-071). */
export function fetchArchiveUploaders(target: ArchiveTarget, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/records/archive/uploaders', { params: { header: scopeHeaders(target) }, signal }),
  )
}
