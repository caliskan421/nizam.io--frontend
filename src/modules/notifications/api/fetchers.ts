import { api, unwrap } from '@/shared/http'
import type { NotificationListFilters } from '@/shared/http/query-keys'

import { LIST_PAGE_LIMIT, MUTES_PAGE_LIMIT } from '../model/refresh'
import type { NotificationCounts } from '../model/types'

/**
 * Panel sayfası (S1; `limit` istemci sabiti 30, imleç opak). Süzgeçler SUNUCUDADIR (BE-144/145):
 * yalnız doluysa gönderilir; imleç süzgeçler arasında taşınır (sekme değişimi ilk sayfadan başlar).
 */
export function fetchNotifications(
  cursor: string | undefined,
  signal?: AbortSignal,
  filters: NotificationListFilters = {},
) {
  return unwrap(
    api.GET('/v1/notifications', {
      params: {
        query: {
          limit: LIST_PAGE_LIMIT,
          ...(cursor ? { cursor } : {}),
          ...(filters.awaiting ? { awaiting: true } : {}),
          ...(filters.unread_only ? { unread_only: true } : {}),
          ...(filters.type?.length ? { type: [...filters.type] } : {}),
        },
      },
      signal,
    }),
  )
}

/** Zil (`count` = okunmamış GRUP) ve "Senden bekleyen" (`awaiting_count`): iki ayrı sayı. */
export async function fetchNotificationCounts(signal?: AbortSignal): Promise<NotificationCounts> {
  return unwrap(api.GET('/v1/notifications/unread-count', { signal }))
}

export function fetchPushPublicKey(signal?: AbortSignal) {
  return unwrap(api.GET('/v1/notifications/vapid-public-key', { signal }))
}

/** "Sessize alınan konular" sayfası (S1; en yeniden; `limit` 1–100, imleç opak). */
export function fetchSubjectMutes(cursor: string | undefined, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/notifications/subject-mutes', {
      params: { query: { limit: MUTES_PAGE_LIMIT, ...(cursor ? { cursor } : {}) } },
      signal,
    }),
  )
}
