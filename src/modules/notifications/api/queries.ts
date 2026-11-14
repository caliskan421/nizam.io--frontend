/**
 * Bildirim okuyucuları (14 `backend.md` §1; hepsi S1, hesap geneli, kapsamsız anahtar). Her
 * okuyucu `sessionBound` kapısından geçer ve `signal`'i iletir (KESİN 26b); oturum/hesap
 * değişince bütün sorgular iptal edilip düşer (`bindSessionQueries`). SSE YOK (P65): sayaç
 * `staleTime` 30 sn + odak + 60 sn aralık, liste yalnız panel açıkken 30 sn + odak.
 */
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type QueryFunctionContext,
} from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { ApiError } from '@/shared/errors/api-error'
import { queryKeys } from '@/shared/http/query-keys'
import { retryTransient } from '@/shared/http/retry'
import { sessionBound } from '@/shared/session/query-session'
import { useSessionStore } from '@/shared/session/store'

import {
  LIST_INTERVAL_MS,
  LIST_STALE_MS,
  PUSH_KEY_STALE_MS,
  UNREAD_INTERVAL_MS,
  UNREAD_STALE_MS,
} from '../model/refresh'
import type { NotificationPage } from '../model/types'
import { fetchNotifications, fetchPushPublicKey, fetchUnreadNotificationCount } from './fetchers'

/** Zil sayacı anahtarı (kenar menüsü ve ana sayfa ile ORTAK). */
export const UNREAD_NOTIFICATIONS_KEY = queryKeys.notifications.unreadCount()

/** Okunmamış bildirim sayısı (E-00-38/E-14-83; hesap geneli). Hata → `null` (rozet gizli). */
export function useUnreadNotifications(
  fetcher: (signal?: AbortSignal) => Promise<number> = fetchUnreadNotificationCount,
) {
  const session = useSessionStore()
  const query = useQuery({
    queryKey: UNREAD_NOTIFICATIONS_KEY,
    queryFn: sessionBound(({ signal }: QueryFunctionContext) => fetcher(signal)),
    enabled: computed(() => session.isAuthenticated),
    staleTime: UNREAD_STALE_MS,
    refetchInterval: UNREAD_INTERVAL_MS,
    refetchIntervalInBackground: false,
  })
  const count = computed<number | null>(() =>
    query.isError.value ? null : (query.data.value ?? null),
  )
  return { count }
}

/**
 * Panel listesi (E-14-09…19): `open` kapalıyken sorgu etkin DEĞİLDİR (okunmaz). `loadMore`
 * "Daha eski bildirimler" düğmesidir; bozuk imleç (`notifications.invalid_cursor`) imleci atıp
 * ilk sayfadan yeniden başlar (sessiz). Sekme süzgeci istemcidedir (okunmamış = `!is_read`).
 */
export function useNotifications(open: MaybeRefOrGetter<boolean>) {
  const session = useSessionStore()
  const client = useQueryClient()
  const query = useInfiniteQuery(
    computed(() => ({
      queryKey: queryKeys.notifications.list(),
      queryFn: sessionBound(
        ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
          fetchNotifications(pageParam || undefined, signal),
      ),
      initialPageParam: '',
      getNextPageParam: (page: NotificationPage) => page.next_cursor || undefined,
      enabled: toValue(open) && session.isAuthenticated,
      staleTime: LIST_STALE_MS,
      refetchInterval: toValue(open) ? LIST_INTERVAL_MS : false,
      refetchIntervalInBackground: false,
      retry: retryTransient,
    })),
  )
  const items = computed(() => query.data.value?.pages.flatMap((page) => page.items) ?? [])
  /** Sunucu sayacı (kesin; yüklenen kümeden bağımsız). */
  const unreadCount = computed(() => query.data.value?.pages[0]?.unread_count ?? null)

  async function loadMore(): Promise<void> {
    const result = await query.fetchNextPage()
    const error = result.error
    if (error instanceof ApiError && error.code === 'notifications.invalid_cursor') {
      await client.resetQueries({ queryKey: queryKeys.notifications.list() })
    }
  }
  return { query, items, unreadCount, loadMore }
}

/** VAPID açık anahtarı (E-14-60): `enabled=false` → kutu gizli (hata değil, K24). */
export function usePushPublicKey(enabled: MaybeRefOrGetter<boolean> = true) {
  const session = useSessionStore()
  return useQuery(
    computed(() => ({
      queryKey: queryKeys.notifications.pushKey(),
      queryFn: sessionBound(({ signal }: QueryFunctionContext) => fetchPushPublicKey(signal)),
      enabled: toValue(enabled) && session.isAuthenticated,
      staleTime: PUSH_KEY_STALE_MS,
      refetchOnWindowFocus: false,
      retry: retryTransient,
    })),
  )
}
