/**
 * Silinen kayıt okuyucuları (görev, toplantı, koordinatörlük: S2; hesap: S1). Dört liste de aynı
 * sunucu süzgeç/sıra parametrelerini alır (`q`, `deleted_from`, `deleted_by`, `department_id`,
 * `sort`/`order`; BE-117) ve zarfta süzgece uyan `total` döner. İmleç sıraya bağlıdır: süzgeç ya
 * da sıra değişince imleç gönderilmez (ilk sayfa; sorgu anahtarı yeni olur). Koordinatörlük
 * listesi `department_id` almaz (sunucu yok sayar).
 */
import { programHeaders } from '@/modules/work/public'
import { api, unwrap } from '@/shared/http'

import type { ListQuery } from '../model/filters'

/** İstemci 1…200 tam sayı gönderir (sınır dışı hiç gitmez; `backend.md` çerçeve). */
export const DELETED_PAGE_LIMIT = 200

function page(query: ListQuery, cursor: string | undefined) {
  return { limit: DELETED_PAGE_LIMIT, ...query, ...(cursor ? { cursor } : {}) }
}

/** `listDeletedWorkItems` (S2, yalnız şirket yöneticisi; program başlığı zorunlu). */
export function fetchDeletedWorkItems(
  programId: string,
  query: ListQuery,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/admin/deleted/work-items', {
      params: { header: programHeaders({ programId }), query: page(query, cursor) },
      signal,
    }),
  )
}

/** `adminListDeletedMeetings` (S2; yönetici yaşam döngüsü yolu, `listDeletedMeetings` ile aynı). */
export function fetchDeletedMeetings(
  programId: string,
  query: ListQuery,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/admin/deleted/meetings', {
      params: { header: programHeaders({ programId }), query: page(query, cursor) },
      signal,
    }),
  )
}

/** `listDeletedDepartments` (S2 başlıklı; `department_id` süzgeci bu listede yoktur). */
export function fetchDeletedDepartments(
  programId: string,
  query: ListQuery,
  cursor?: string,
  signal?: AbortSignal,
) {
  const rest = { ...query }
  delete rest.department_id
  return unwrap(
    api.GET('/v1/admin/deleted/departments', {
      params: { header: programHeaders({ programId }), query: page(rest, cursor) },
      signal,
    }),
  )
}

/** `listDeletedAccounts` (S1, hesap geneli; program başlığı yok sayılır). */
export function fetchDeletedAccounts(query: ListQuery, cursor?: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/admin/deleted/accounts', {
      params: { query: page(query, cursor) },
      signal,
    }),
  )
}
