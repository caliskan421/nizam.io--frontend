/**
 * `countUnreadNotifications` (S1, hesap geneli; E-Ü1-23): Ü1 "‹n› yeni" sayacı. Anahtar kabuk
 * rozetiyle AYNIDIR (`queryKeys.notifications.unreadCount`): bir okuma iki tüketiciyi besler,
 * okundu yazmaları ikisini birden geçersiz kılar. Bildirim LİSTESİ F7'dedir (liste yok).
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'

import { retryTransient } from '@/modules/work/public'
import { api, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { sessionBound } from '@/shared/session/query-session'

const STALE_MS = 30_000

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: sessionBound(async ({ signal }: QueryFunctionContext) => {
      const result = await unwrap(api.GET('/v1/notifications/unread-count', { signal }))
      return result.count
    }),
    retry: retryTransient,
    staleTime: STALE_MS,
  })
}
