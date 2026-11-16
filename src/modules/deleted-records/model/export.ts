/**
 * "CSV indir" bilet hedefi (BE-116; REPORTING-K16): `GET /v1/admin/deleted/export` (S2, yalnız
 * şirket yöneticisi). Bilet hedefi kapalı listededir ve sorgu dizesiyle bire bir olmalıdır
 * (`identity.download_target_invalid`): yol burada tek yerde, deterministik sırayla kurulur.
 * Ekran süzgeçleri (`q`, `deleted_from`, `deleted_by`, `department_id`) ve YALNIZ etkin tür
 * (`kinds`; W169 varsayım 12) aynen gönderilir; sıra CSV'ye taşınmaz (bloklar silinme anı azalan).
 * Departman kapsamı `program`dır (listeyle ve özetle aynı küme).
 */
import type { DownloadTarget } from '@/shared/download'

import type { ListQuery } from './filters'
import type { DeletedKind } from './kinds'

/** `kinds` değerleri (sözleşme: `tasks`, `meetings`, `departments`, `accounts`). Testle sabit. */
export const EXPORT_KINDS: Readonly<Record<DeletedKind, string>> = {
  gorev: 'tasks',
  toplanti: 'meetings',
  koordinatorluk: 'departments',
  kullanici: 'accounts',
}

export const EXPORT_PATH = '/v1/admin/deleted/export'

/** Sunucu `Content-Disposition` vermezse kaydedilecek ad (yalnız ASCII). */
export const EXPORT_FALLBACK_NAME = 'silinen-kayitlar.csv'

/** CSV tavanı (REPORTING-K16): aşılırsa 422 `reporting.export_too_large`. */
export const EXPORT_MAX_ROWS = 10_000

export interface ExportRequest {
  programId: string
  kind: DeletedKind
  query: ListQuery
}

/** Sorgu dizesi: sabit parametre sırası; boş değer yazılmaz; sıra/`sort` CSV'ye taşınmaz. */
export function exportQuery(request: ExportRequest): string {
  const { kind, query } = request
  const params = new URLSearchParams()
  params.set('kinds', EXPORT_KINDS[kind])
  params.set('scope', 'program')
  if (query.q) params.set('q', query.q)
  if (query.deleted_from) params.set('deleted_from', query.deleted_from)
  if (query.deleted_by) params.set('deleted_by', query.deleted_by)
  // Koordinatörlük türünde sunucu `department_id`'yi yok sayar; göndermek hedefi gereksiz uzatır.
  if (query.department_id && kind !== 'koordinatorluk') {
    params.set('department_id', query.department_id)
  }
  return params.toString()
}

export function exportTarget(request: ExportRequest): DownloadTarget {
  return {
    method: 'GET',
    path: `${EXPORT_PATH}?${exportQuery(request)}`,
    headers: { 'X-Nizamio-Program': request.programId },
    fallbackName: EXPORT_FALLBACK_NAME,
  }
}
