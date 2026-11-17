/**
 * W184 okuyucuları (BE-084 paylaşılan sayılar ve bağ listeleri, BE-085 mesaj görevleri, BE-028
 * okundu bilgisi). Hepsi `sessionBound` kapısından geçer ve `signal`'i iletir (KESİN 26b);
 * anahtarlar `queryKeys.chats.*` (S2, kapsamlı). Sayaç = liste toplamı: ayrı türetim yoktur.
 */
import { useInfiniteQuery, useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import type {
  ChatAttachmentList,
  ChatTaskLinkList,
  GateSource,
  IdSource,
} from '../model/shared-types'
import { retryTransient } from './http'
import {
  fetchAttachments,
  fetchMessageTasks,
  fetchReceipts,
  fetchSharedCounts,
  fetchTaskLinks,
} from './shared-fetchers'

export const SHARED_STALE_MS = 30_000

/** `getChatSharedCounts`: beş sayı tek sorguyla (`message.created/deleted` olayında yenilenir). */
export function useChatSharedCounts(chatId: IdSource, enabled: GateSource = true) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const id = toValue(chatId)
      return {
        queryKey: queryKeys.chats.sharedCounts(scope, id ?? ''),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchSharedCounts(scope.programId!, id!, signal),
        ),
        enabled: scope.programId !== null && id !== null && toValue(enabled),
        staleTime: SHARED_STALE_MS,
        retry: retryTransient,
      }
    }),
  )
}

/** Cihaz ekleri (arşivden paylaşılan dosyalardan AYRI liste; `seq DESC`, imleçli). */
export function useChatAttachments(chatId: IdSource, enabled: GateSource = true) {
  const store = useScopeStore()
  const query = useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const id = toValue(chatId)
      return {
        queryKey: queryKeys.chats.attachments(scope, id ?? ''),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchAttachments(scope.programId!, id!, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (page: ChatAttachmentList) => page.next_cursor || undefined,
        enabled: scope.programId !== null && id !== null && toValue(enabled),
        staleTime: SHARED_STALE_MS,
        retry: retryTransient,
      }
    }),
  )
  const items = computed(() => query.data.value?.pages.flatMap((page) => page.items) ?? [])
  return { query, items }
}

/** Mesajdan açılan görev bağları (`seq DESC`, imleçli; görünürlük/kart görev ucundan). */
export function useChatTaskLinks(chatId: IdSource, enabled: GateSource = true) {
  const store = useScopeStore()
  const query = useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const id = toValue(chatId)
      return {
        queryKey: queryKeys.chats.taskLinks(scope, id ?? ''),
        queryFn: sessionBound(
          ({ signal, pageParam }: QueryFunctionContext<readonly unknown[], string>) =>
            fetchTaskLinks(scope.programId!, id!, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (page: ChatTaskLinkList) => page.next_cursor || undefined,
        enabled: scope.programId !== null && id !== null && toValue(enabled),
        staleTime: SHARED_STALE_MS,
        retry: retryTransient,
      }
    }),
  )
  const items = computed(() => query.data.value?.pages.flatMap((page) => page.items) ?? [])
  return { query, items }
}

/** `listChatMessageTasks`: mesajın görevlerini TEK istekle çözer (görev başına istek yok). */
export function useChatMessageTasks(
  chatId: IdSource,
  messageId: IdSource,
  enabled: GateSource = true,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const id = toValue(chatId)
      const mid = toValue(messageId)
      return {
        queryKey: queryKeys.chats.messageTasks(scope, id ?? '', mid ?? ''),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchMessageTasks(scope.programId!, id!, mid!, signal),
        ),
        enabled: scope.programId !== null && id !== null && mid !== null && toValue(enabled),
        staleTime: SHARED_STALE_MS,
        retry: retryTransient,
      }
    }),
  )
}

/** `listChatMessageReceipts`: yalnız kendi mesajım (başkasınınki 403, istek hiç gönderilmez). */
export function useChatMessageReceipts(
  chatId: IdSource,
  messageId: IdSource,
  enabled: GateSource = true,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const id = toValue(chatId)
      const mid = toValue(messageId)
      return {
        queryKey: queryKeys.chats.receipts(scope, id ?? '', mid ?? ''),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchReceipts(scope.programId!, id!, mid!, signal),
        ),
        enabled: scope.programId !== null && id !== null && mid !== null && toValue(enabled),
        staleTime: 0,
        retry: retryTransient,
      }
    }),
  )
}
