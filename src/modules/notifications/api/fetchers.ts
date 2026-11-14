import { api, unwrap } from '@/shared/http'

import { LIST_PAGE_LIMIT } from '../model/refresh'

/** Panel sayfası (S1; `limit` istemci sabiti 30, imleç opak). */
export function fetchNotifications(cursor: string | undefined, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/notifications', {
      params: { query: { limit: LIST_PAGE_LIMIT, ...(cursor ? { cursor } : {}) } },
      signal,
    }),
  )
}

export async function fetchUnreadNotificationCount(signal?: AbortSignal): Promise<number> {
  const result = await unwrap(api.GET('/v1/notifications/unread-count', { signal }))
  return result.count
}

export function fetchPushPublicKey(signal?: AbortSignal) {
  return unwrap(api.GET('/v1/notifications/vapid-public-key', { signal }))
}
