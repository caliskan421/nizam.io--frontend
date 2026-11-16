/**
 * Arşiv okuma uçları (06 `backend.md` §1). İki yüz (RECORDS-K39): koordinatör/üye S3
 * (`/v1/records/archive/*`, program + departman başlığı) ve şirket yöneticisi S2
 * (`/v1/program/archive/*`, yalnız program başlığı; `department_id` isteğe bağlı sorgu
 * süzgeci). Kaynak (`ArchiveSource`) hangisinin çağrılacağını söyler; başlık İSTEĞE ÖZELDİR,
 * HTTP ara katmanı açık başlığı depo kapsamının önüne koyar. Başlıksız (kaynaksız) istek atılmaz:
 * çağıranlar kaynağı `null` iken sorguyu etkinleştirmez.
 */
import { programHeaders, scopeHeaders } from '@/modules/work/public'
import { api, unwrap } from '@/shared/http'
import { unwrapList } from '@/shared/http/truncation'

import { toQuery } from '../model/filters'
import { isProgramSource } from '../model/types'
import type { ArchiveFileFilters, ArchiveSource } from '../model/types'

/** S2 süzgeci: yalnız dolu `department_id` gönderilir. */
const departmentQuery = (departmentId: string | null) =>
  departmentId === null ? {} : { department_id: departmentId }

/** `archiveFolders` / `programArchiveFolders` — klasör özeti + `totals` (imleçsiz). */
export function fetchArchiveFolders(source: ArchiveSource, signal?: AbortSignal) {
  if (isProgramSource(source)) {
    return unwrap(
      api.GET('/v1/program/archive/folders', {
        params: { header: programHeaders(source) },
        signal,
      }),
    )
  }
  return unwrap(
    api.GET('/v1/records/archive/folders', { params: { header: scopeHeaders(source) }, signal }),
  )
}

/**
 * `archiveTasks` / `programArchiveTasks` — görev seçenekleri (≤200; kesilirse
 * `X-Result-Truncated`, `truncated: true`). `includeEmpty` yalnız YÜKLEME seçicisi içindir
 * (dosyasız canlı görevler de, RECORDS-K42); klasör görevleri ve seçimli ZIP parametresiz kümeyi
 * (yalnız dosyalı görevler) kullanır.
 */
export function fetchArchiveTasks(
  source: ArchiveSource,
  includeEmpty: boolean,
  signal?: AbortSignal,
) {
  const empty = includeEmpty ? ({ include_empty: 'true' } as const) : {}
  if (isProgramSource(source)) {
    return unwrapList(
      api.GET('/v1/program/archive/tasks', {
        params: {
          header: programHeaders(source),
          query: { ...departmentQuery(source.departmentId), ...empty },
        },
        signal,
      }),
    )
  }
  return unwrapList(
    api.GET('/v1/records/archive/tasks', {
      params: { header: scopeHeaders(source), query: empty },
      signal,
    }),
  )
}

/** `archiveAttachments` / `programArchiveAttachments` — bir sayfa (imleçli; `total` kesin toplam). */
export function fetchArchiveAttachments(
  source: ArchiveSource,
  filters: ArchiveFileFilters,
  cursor?: string,
  signal?: AbortSignal,
) {
  if (isProgramSource(source)) {
    return unwrap(
      api.GET('/v1/program/archive/attachments', {
        params: {
          header: programHeaders(source),
          query: { ...toQuery(filters, cursor), ...departmentQuery(source.departmentId) },
        },
        signal,
      }),
    )
  }
  return unwrap(
    api.GET('/v1/records/archive/attachments', {
      params: { header: scopeHeaders(source), query: toQuery(filters, cursor) },
      signal,
    }),
  )
}

/** `archiveUploaders` / `programArchiveUploaders` — yükleyen kimlikleri + `uploader_details` adları. */
export function fetchArchiveUploaders(source: ArchiveSource, signal?: AbortSignal) {
  if (isProgramSource(source)) {
    return unwrap(
      api.GET('/v1/program/archive/uploaders', {
        params: { header: programHeaders(source), query: departmentQuery(source.departmentId) },
        signal,
      }),
    )
  }
  return unwrap(
    api.GET('/v1/records/archive/uploaders', { params: { header: scopeHeaders(source) }, signal }),
  )
}
