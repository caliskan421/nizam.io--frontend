/**
 * Sohbet gerçek zamanı (K8, P65, KESİN 34): akış SAYFA SAHİBİNDEDİR (`/mesajlar` açıkken); sohbet
 * modülü `EventSource` kullanmaz ve akışı doğrudan açmaz — `shared/sse` tüketir. Olay → içeriksiz
 * sorgu geçersizleme + pencere okuması (`model/events.ts` planı). Program değişince akış yeniden
 * açılır (eski kapanır, eski programın olayı işlenmez); oturum değişince kapanır ve sayfa yeniden
 * kurulana dek açılmaz. Sayfa sökülünce (sahip) akış ve bekleyen birleştirmeler kapanır.
 * Bildirimlerde SSE YOKTUR.
 */
import { useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, onScopeDispose, ref, toValue, watch } from 'vue'

import { ownerLife } from '@/shared/http/mutation'
import { resourceFilter } from '@/shared/http/query-keys'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useScopeStore } from '@/shared/scope/store'
import { useSessionStore } from '@/shared/session/store'
import { openEventStream, type StreamEvent, type StreamState } from '@/shared/sse'

import { createTypingTracker, TYPING_TTL_MS } from '../model/typing'
import type { ChatStreamOptions } from '../model/types'
import { dispatchEvent } from './stream-apply'

/** Önce akış (abonelik), SONRA liste uzlaştırması (§10.5); GAP-209 boşluğunu da kapatır. */
function reconcileLists(client: QueryClient, scope: ScopeSnapshot): void {
  for (const resource of ['chats.list', 'chats.unreadOverview'] as const) {
    const filter = resourceFilter(resource, scope)
    if (filter) void client.invalidateQueries(filter)
  }
}

/** "Yazıyor" durumu: ÖNBELLEĞE YAZILMAZ; ~5 sn sonra silinir. */
function useTypingState(options: ChatStreamOptions, selfId: () => string | null) {
  const tracker = createTypingTracker()
  const tick = ref(0)
  const timers = new Set<ReturnType<typeof setTimeout>>()
  const accountIds = computed(() => {
    void tick.value
    const open = toValue(options.chatId)
    return open === null ? [] : tracker.typing(open)
  })
  function touch(event: StreamEvent): void {
    if (event.actorAccountId === selfId()) return
    tracker.touch(event.chatId, event.actorAccountId)
    tick.value += 1
    const timer = setTimeout(() => {
      timers.delete(timer)
      tick.value += 1
    }, TYPING_TTL_MS + 50)
    timers.add(timer)
  }
  function clear(): void {
    tracker.clear()
    for (const timer of timers) clearTimeout(timer)
    timers.clear()
  }
  return { accountIds, touch, clear }
}

/** Bekleyen uzlaştırma: başarısız olay okuması için tek tetikte tek `reconcile` (tekrar döngüsü yok). */
function usePendingReconcile(options: ChatStreamOptions, alive: () => boolean) {
  let pending = false
  function run(): void {
    if (!pending || !alive()) return
    pending = false
    options.messages?.reconcile().catch(() => {
      pending = true
    })
  }
  function onVisible(): void {
    if (globalThis.document?.visibilityState !== 'hidden') run()
  }
  globalThis.addEventListener?.('online', run)
  globalThis.addEventListener?.('focus', run)
  globalThis.document?.addEventListener('visibilitychange', onVisible)
  onScopeDispose(() => {
    globalThis.removeEventListener?.('online', run)
    globalThis.removeEventListener?.('focus', run)
    globalThis.document?.removeEventListener('visibilitychange', onVisible)
  })
  return {
    mark: () => {
      pending = true
    },
    /** Yeniden bağlanma uzlaştırması bekleyeni de karşılar. */
    reconnected: () => {
      pending = false
      options.messages?.reconcile().catch(() => {
        pending = true
      })
    },
  }
}

export function useChatStream(options: ChatStreamOptions) {
  const client = useQueryClient()
  const scopeStore = useScopeStore()
  const session = useSessionStore()
  const owner = ownerLife()
  const state = ref<StreamState>('closed')
  const typing = useTypingState(options, () => session.accountId)
  const pending = usePendingReconcile(options, owner.alive)
  let handle: ReturnType<typeof openEventStream> | null = null
  let generation = 0

  function close(): void {
    generation += 1
    handle?.close()
    handle = null
    typing.clear()
    state.value = 'closed'
  }

  function open(): void {
    close()
    const programId = scopeStore.programId
    if (!(toValue(options.enabled) ?? true) || programId === null || !session.isAuthenticated) {
      return
    }
    const mine = generation
    const scope = { ...scopeStore.snapshot }
    const current = () => mine === generation && owner.alive()
    handle = openEventStream({
      path: '/v1/chats/stream',
      programId,
      signal: new AbortController().signal,
      onState: (next) => {
        if (mine === generation) state.value = next
      },
      onTyping: (event) => current() && typing.touch(event),
      onOpen: ({ reconnect }) => {
        if (!current()) return
        reconcileLists(client, scope)
        if (reconnect) pending.reconnected()
      },
      deps: options.deps,
      onEvent: (event) =>
        current() &&
        dispatchEvent(
          {
            client,
            scope,
            options,
            meAccountId: session.accountId,
            alive: owner.alive,
            onReadFailed: () => current() && pending.mark(),
          },
          event,
        ),
    })
  }

  // Program ya da oturum değişince akış yeniden kurulur; sayfa sökülünce kapanır.
  const stop = watch(
    [() => scopeStore.programId, () => session.isAuthenticated, () => toValue(options.enabled)],
    open,
    { immediate: true },
  )
  onScopeDispose(() => {
    stop()
    close()
  })

  return { state, typingAccountIds: typing.accountIds, reopen: open, close }
}
