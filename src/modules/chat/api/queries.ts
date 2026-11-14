/**
 * Sohbet okuyucuları (10 `backend.md` §1, §5). Hepsi `sessionBound` kapısından geçer ve `signal`'i
 * iletir (KESİN 26b). Anahtarlar `query-keys.ts` (`chats.*`, `chatsUnread.overview`); S2 sorgular
 * kapsamlıdır (program/departman/mercek değişince düşer, K2), özet (S1) hesap geneldir.
 * Yükleme tekrarı yalnız geçici hatalarda (`retryTransient`); 4xx bir hükümdür.
 */
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type Query,
  type QueryFunctionContext,
} from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { ApiError } from '@/shared/errors/api-error'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'
import { useSessionStore } from '@/shared/session/store'

import type {
  ChatList,
  ChatRefList,
  ChatRefSummary,
  ChatUnreadOverview,
  CandidatePurpose,
  RefKind,
} from '../model/types'
import {
  CHAT_LIST_LIMIT,
  fetchCandidates,
  fetchChat,
  fetchChats,
  fetchMembers,
  fetchPins,
  fetchRefs,
  fetchRefSummary,
  fetchUnreadOverview,
} from './fetchers'
import { retryTransient } from './http'

export const CHAT_LIST_STALE_MS = 15_000
export const CHAT_DETAIL_STALE_MS = 30_000
export const UNREAD_OVERVIEW_STALE_MS = 30_000
export const UNREAD_OVERVIEW_INTERVAL_MS = 60_000
export const REF_SUMMARY_STALE_MS = 300_000

/**
 * Sohbet listesi (E-10-05, E-10-08): son etkinliğe göre, imleçli; `q` ≤100 karakter (sunucu
 * arar). Süzgeç sekmeleri istemci süzgecidir (BE-081) ve yalnız yüklenen sayfalara uygulanır.
 * Bozuk imleç (`messaging.invalid_cursor`) atılır, ilk sayfadan yeniden başlanır (sessiz).
 */
export function useChats(q: MaybeRefOrGetter<string> = '') {
  const store = useScopeStore()
  const client = useQueryClient()
  const query = useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const term = toValue(q).trim().slice(0, 100)
      return {
        queryKey: queryKeys.chats.list(scope, term),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchChats(scope.programId!, { q: term, cursor: pageParam || undefined }, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (page: ChatList) => page.next_cursor || undefined,
        enabled: scope.programId !== null,
        staleTime: CHAT_LIST_STALE_MS,
        retry: retryTransient,
      }
    }),
  )
  const items = computed(() => query.data.value?.pages.flatMap((page) => page.items) ?? [])
  async function loadMore(): Promise<void> {
    const result = await query.fetchNextPage()
    const error = result.error
    if (error instanceof ApiError && error.code === 'messaging.invalid_cursor') {
      await client.resetQueries({
        queryKey: queryKeys.chats.list(store.snapshot, toValue(q).trim().slice(0, 100)),
      })
    }
  }
  return { query, items, loadMore, limit: CHAT_LIST_LIMIT }
}

/** `getChat`: rol (`admin`/`founder`/`member`) ve tür; 404 → "Bu konuşma bulunamadı". */
export function useChat(chatId: MaybeRefOrGetter<string | null>) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const id = toValue(chatId)
      return {
        queryKey: queryKeys.chats.detail(scope, id ?? ''),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchChat(scope.programId!, id!, signal),
        ),
        enabled: scope.programId !== null && id !== null,
        staleTime: CHAT_DETAIL_STALE_MS,
        retry: retryTransient,
      }
    }),
  )
}

/** Sabit mesajlar (`pinned_at DESC`, imleçsiz, `truncated`). */
export function useChatPins(chatId: MaybeRefOrGetter<string | null>) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const id = toValue(chatId)
      return {
        queryKey: queryKeys.chats.pins(scope, id ?? ''),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchPins(scope.programId!, id!, signal),
        ),
        enabled: scope.programId !== null && id !== null,
        staleTime: CHAT_DETAIL_STALE_MS,
        retry: retryTransient,
      }
    }),
  )
}

/** Üyeler (en çok 200 + `truncated`): yazıyor/@kişi adı çözümü ve grup bilgisi. */
export function useChatMembers(
  chatId: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const id = toValue(chatId)
      return {
        queryKey: queryKeys.chats.members(scope, id ?? ''),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchMembers(scope.programId!, id!, signal),
        ),
        enabled: scope.programId !== null && id !== null && toValue(enabled),
        staleTime: CHAT_DETAIL_STALE_MS,
        retry: retryTransient,
      }
    }),
  )
}

/**
 * Aday listesi (`purpose=direct|group`; grupta `chat_id` ile mevcut üyeler düşer). Pencere
 * açılışında TAZE okunur (`staleTime` 0); `truncated` → "Liste ilk 200 kişiyle sınırlı".
 */
export function useChatCandidates(
  purpose: MaybeRefOrGetter<CandidatePurpose>,
  chatId: MaybeRefOrGetter<string | null> = null,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const why = toValue(purpose)
      const id = toValue(chatId)
      return {
        queryKey: queryKeys.chats.candidates(scope, why, id ?? ''),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchCandidates(scope.programId!, why, id, signal),
        ),
        enabled: scope.programId !== null && toValue(enabled),
        staleTime: 0,
        retry: retryTransient,
      }
    }),
  )
}

/**
 * Referans kartı özeti (`ref_id` önbelleği; sohbet açılışında yeniden okunur). `available:false`
 * önbellekte TAZE sayılmaz (hedef geri gelebilir): her açılışta yeniden okunur. Özet her sohbet
 * üyesine açıktır (MESSAGING-K31/K32, P60): kilit çizilmez, yalnız "artık yok" kartı vardır.
 */
export function useChatRefSummary(refId: MaybeRefOrGetter<string | null>) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const id = toValue(refId)
      return {
        queryKey: queryKeys.chats.refSummary(scope, id ?? ''),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchRefSummary(scope.programId!, id!, signal),
        ),
        enabled: scope.programId !== null && id !== null,
        staleTime: (query: Query<ChatRefSummary>) =>
          query.state.data?.available === false ? 0 : REF_SUMMARY_STALE_MS,
        retry: retryTransient,
      }
    }),
  )
}

/** Paylaşılanlar (`listChatRefs`; `kind` süzgeci, imleçli; toplam sayı yok → BE-084). */
export function useChatRefs(
  chatId: MaybeRefOrGetter<string | null>,
  kind: MaybeRefOrGetter<RefKind>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const store = useScopeStore()
  const query = useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const id = toValue(chatId)
      const k = toValue(kind)
      return {
        queryKey: queryKeys.chats.refs(scope, id ?? '', k),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchRefs(scope.programId!, id!, k, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (page: ChatRefList) => page.next_cursor || undefined,
        enabled: scope.programId !== null && id !== null && toValue(enabled),
        staleTime: CHAT_DETAIL_STALE_MS,
        retry: retryTransient,
      }
    }),
  )
  const items = computed(() => query.data.value?.pages.flatMap((page) => page.items) ?? [])
  return { query, items }
}

/**
 * Programlar arası okunmamış özeti (S1, hesap geneli): rozet kaynağı. `staleTime` 30 sn + odak +
 * 60 sn aralık (yalnız görünürken); `/mesajlar` açıkken SSE olayları ayrıca yeniler.
 */
export function useChatUnreadOverview(
  enabled: MaybeRefOrGetter<boolean> = true,
  fetcher: (signal?: AbortSignal) => Promise<ChatUnreadOverview> = fetchUnreadOverview,
) {
  const session = useSessionStore()
  const store = useScopeStore()
  const query = useQuery(
    computed(() => ({
      queryKey: queryKeys.chatsUnread.overview(),
      queryFn: sessionBound(({ signal }: QueryFunctionContext) => fetcher(signal)),
      enabled: toValue(enabled) && session.isAuthenticated,
      staleTime: UNREAD_OVERVIEW_STALE_MS,
      refetchInterval: UNREAD_OVERVIEW_INTERVAL_MS,
      refetchIntervalInBackground: false,
      retry: retryTransient,
    })),
  )
  /** Seçili programın satırı; satır yok ya da hata → `null` (rozet gizli). */
  const selected = computed(() => {
    if (query.isError.value) return null
    return query.data.value?.items.find((row) => row.program_id === store.programId) ?? null
  })
  return { query, selected }
}
