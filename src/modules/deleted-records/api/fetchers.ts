/**
 * Silinen kayıt okuyucuları (S2: görev; S1: hesap). Toplantı ve koordinatörlük listeleri kendi
 * modüllerinin okuyucularıdır (`useDeletedMeetings`, `useDeletedDepartments`; aynı uç ve anahtar,
 * kopya yok). Sunucuda `sort`/`q`/süzgeç yoktur: yalnız `limit` ve `cursor` (BE-117).
 */
import { programHeaders } from '@/modules/work/public'
import { api, unwrap } from '@/shared/http'

/** İstemci 1…200 tam sayı gönderir (sınır dışı hiç gitmez; `backend.md` çerçeve). */
export const DELETED_PAGE_LIMIT = 200

/** `listDeletedWorkItems` (S2, yalnız şirket yöneticisi; program başlığı zorunlu). */
export function fetchDeletedWorkItems(programId: string, cursor?: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/admin/deleted/work-items', {
      params: {
        header: programHeaders({ programId }),
        query: { limit: DELETED_PAGE_LIMIT, ...(cursor ? { cursor } : {}) },
      },
      signal,
    }),
  )
}

/** `listDeletedAccounts` (S1, hesap geneli; program başlığı yok sayılır). */
export function fetchDeletedAccounts(cursor?: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/admin/deleted/accounts', {
      params: { query: { limit: DELETED_PAGE_LIMIT, ...(cursor ? { cursor } : {}) } },
      signal,
    }),
  )
}
