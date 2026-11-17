/**
 * Mesaj penceresi okuyucusu (10 `backend.md` §1/§5, istemci-akislari §10.3). Sorgu verisi
 * `MessageWindow`'dur; `queryFn` pencereyi KURAR (ilk açılış: son sayfa) ya da UZLAŞTIRIR (yeniden
 * okuma: `after` + pencerenin `before` ile yeniden okunması). Sayfa, eylem ve SSE okumaları aynı
 * depoya (`windowStore`) adım adım yazar; eşzamanlı yerel yamalar kaybolmaz. Pencere işlemleri
 * hook başına SIRAYLA koşar (aynı sohbette iki toplu okuma yarışmaz). Sahip sökülünce yeni okuma
 * başlamaz ve uçuştaki okuma iptal edilir (KESİN 26a).
 */
import { useQuery, useQueryClient, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, onScopeDispose, toValue, type MaybeRefOrGetter } from 'vue'

import { ownerLife } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import { refreshReadState } from '../model/read-state'
import { emptyWindow, type MessageWindow } from '../model/window'
import {
  loadAround,
  loadNewer,
  loadOlder,
  reconcile,
  refreshAround,
  type MessageReader,
  type WindowStore,
} from '../model/window-io'
import type { MessageReadContext } from '../model/types'
import { fetchMessages } from './fetchers'
import { retryTransient } from './http'
import { windowStore } from './window-cache'

/** Oturum kapılı okuyucu: aynı `signal` ile bütün sayfa okumaları tek oturum damgasını paylaşır. */
export function messageReader(
  programId: string,
  chatId: string,
  signal: AbortSignal,
): MessageReader {
  const guarded = sessionBound((context: MessageReadContext) =>
    fetchMessages(programId, chatId, context.query, context.signal),
  )
  return (query) => guarded({ signal, query })
}

export function useChatMessages(chatId: MaybeRefOrGetter<string | null>) {
  const client = useQueryClient()
  const scopeStore = useScopeStore()
  const owner = ownerLife()
  const controller = new AbortController()
  onScopeDispose(() => controller.abort())
  let queue: Promise<void> = Promise.resolve()

  const query = useQuery(
    computed(() => {
      const scope = scopeStore.snapshot
      const id = toValue(chatId)
      return {
        queryKey: queryKeys.chats.messages(scope, id ?? ''),
        queryFn: sessionBound(async ({ signal }: QueryFunctionContext) => {
          const store = windowStore(client, scope, id!, () => scopeStore.snapshot, owner.alive)
          await reconcile(messageReader(scope.programId!, id!, signal), store)
          return store.get()
        }),
        enabled: scope.programId !== null && id !== null,
        // Taze tutan SSE'dir (olay → okuma); yeniden bağlanma uzlaştırması `refetch` ile yapılır.
        staleTime: Number.POSITIVE_INFINITY,
        refetchOnWindowFocus: false,
        retry: retryTransient,
      }
    }),
  )
  const window = computed<MessageWindow>(() => query.data.value ?? emptyWindow())

  /** Pencere işlemini sırayla koşturur; sahip sökülmüşse ya da sohbet yoksa hiçbir şey yapmaz. */
  function run(task: (read: MessageReader, store: WindowStore) => Promise<void>): Promise<void> {
    const scope = { ...scopeStore.snapshot }
    const id = toValue(chatId)
    if (id === null || scope.programId === null) return Promise.resolve()
    const next = queue.then(async () => {
      if (!owner.alive() || controller.signal.aborted) return
      const store = windowStore(client, scope, id, () => scopeStore.snapshot, owner.alive)
      await task(messageReader(scope.programId!, id, controller.signal), store)
    })
    queue = next.catch(() => undefined)
    return next
  }

  /** Giriş okuması: tek kayıtlık sayfa; yalnız `first_unread_seq` kullanılır (pencereye yazılmaz). */
  async function readFirstUnread(): Promise<number | null | undefined> {
    let seq: number | null | undefined
    await run(async (read) => {
      seq = (await read({ limit: 1 })).first_unread_seq
    }).catch(() => undefined)
    return seq
  }

  return {
    query,
    window,
    readFirstUnread,
    loadOlder: () => run(loadOlder),
    loadNewer: () => run(loadNewer),
    /** Alıntı/sabit/bağlantı hedefi: pencere `around=<seq>` ile yeniden kurulur. */
    jumpTo: (seq: number) => run((read, store) => loadAround(read, store, seq)),
    /** `message.updated` ve tepki/oy/sabit sonrası: yerel `seq` çevresi okunur. */
    refreshMessage: (seq: number) => run((read, store) => refreshAround(read, store, seq)),
    /** `read.updated`: birebirde `peer_read_seq`, grupta `read_by_all` (BE-028). */
    refreshPeerRead: () => run(refreshReadState),
    /** Yeniden bağlanma uzlaştırması (§10.5 madde 3). */
    reconcile: () => run(reconcile),
  }
}
