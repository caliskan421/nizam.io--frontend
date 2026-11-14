/**
 * `openEventStream` — uygulamadaki TEK gerçek zamanlı akış girişi (KESİN 34, K8, P65).
 *
 * Olay içeriği önbelleğe yazılmaz: tüketici olayı "bu sohbette değişiklik var" diye okur ve
 * ilgili sorguyu geçersiz kılar. `typing` anlıktır (birleştirilmez); diğer olaylar sohbet başına
 * ≥ 1 sn birleştirilir. Akış, kapsamda program değişince ya da oturum (hesap/nesil) değişince
 * kendiliğinden kapanır; çağıranın `signal`'i de kapatır. Sayfa sökülünce `signal` iptal edilir.
 */
import { getActivePinia } from 'pinia'

import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

import { createCoalescer, type CoalescedEvent, type StreamEvent } from './coalesce'
import {
  StreamConnection,
  type CloseReason,
  type ConnectionDeps,
  type StreamState,
} from './connection'
import { apiTransport, type StreamPath } from './transport'

export interface OpenEventStreamOptions {
  path: StreamPath
  /** Akışın bağlı olduğu program; değişirse akış kapanır. */
  programId: string
  signal: AbortSignal
  /** Birleştirilmiş olay (typing hariç). */
  onEvent: (event: CoalescedEvent) => void
  /** Anlık olay (`typing`); önbelleğe yazılmaz, tüketici kısa ömürlü `ref` tutar. */
  onTyping?: (event: StreamEvent) => void
  /** Akış (yeniden) açıldı: önce akış, SONRA `listChats` uzlaştırması (§10.5 sıra). */
  onOpen?: (info: { reconnect: boolean }) => void
  onState?: (state: StreamState) => void
  onClosed?: (reason: CloseReason | 'scope' | 'session') => void
  /** Test için taşıyıcı/zamanlama değişimi. */
  deps?: Partial<ConnectionDeps>
}

const IMMEDIATE = new Set(['typing'])

interface EventPayload {
  chat_id: string
  message_id: string | null
  actor_account_id: string
  affected_account_ids: string[]
}

function parsePayload(data: string): EventPayload | null {
  try {
    const value = JSON.parse(data) as Partial<EventPayload> | null
    if (!value || typeof value.chat_id !== 'string') return null
    return {
      chat_id: value.chat_id,
      message_id: typeof value.message_id === 'string' ? value.message_id : null,
      actor_account_id: typeof value.actor_account_id === 'string' ? value.actor_account_id : '',
      affected_account_ids: Array.isArray(value.affected_account_ids)
        ? value.affected_account_ids.filter((id): id is string => typeof id === 'string')
        : [],
    }
  } catch {
    return null
  }
}

function defaultDeps(): ConnectionDeps {
  return {
    transport: apiTransport,
    random: Math.random,
    isHidden: () => globalThis.document?.visibilityState === 'hidden',
    onVisibility: (listener) => {
      globalThis.document?.addEventListener('visibilitychange', listener)
      return () => globalThis.document?.removeEventListener('visibilitychange', listener)
    },
  }
}

/** Program ya da oturum değişince `abort` çağrılır; dinlemeyi bırakan işlev döner. */
function watchLifetime(
  programId: string,
  abort: (reason: 'scope' | 'session') => void,
): () => void {
  const generation = authSession.generation
  const account = authSession.snapshot.accountId
  const offSession = authSession.subscribe((snapshot) => {
    const switched =
      snapshot.accountId !== null && account !== null && snapshot.accountId !== account
    if (authSession.generation !== generation || switched) abort('session')
  })
  const offScope = getActivePinia()
    ? useScopeStore().onChange((next) => {
        if (next.programId !== programId) abort('scope')
      })
    : () => undefined
  return () => {
    void offSession()
    offScope()
  }
}

/**
 * Akışı açar ve hemen döner; `close()` ya da `signal` iptali akışı ve bekleyen birleştirmeleri
 * kapatır (geç teslimat yok).
 */
export function openEventStream(options: OpenEventStreamOptions): { close: () => void } {
  const controller = new AbortController()
  let reason: 'scope' | 'session' | null = null
  const stop = (why?: 'scope' | 'session') => {
    reason ??= why ?? null
    controller.abort()
  }
  if (options.signal.aborted) controller.abort()
  else options.signal.addEventListener('abort', () => stop(), { once: true })

  const coalescer = createCoalescer((event) => {
    if (!controller.signal.aborted) options.onEvent(event)
  })
  const unwatch = watchLifetime(options.programId, stop)
  const connection = new StreamConnection(
    options.path,
    options.programId,
    controller.signal,
    {
      onState: (state) => options.onState?.(state),
      onOpen: (reconnect) => options.onOpen?.({ reconnect }),
      onClosed: (why) => options.onClosed?.(why),
      onFrame: (name, data) => {
        const payload = parsePayload(data)
        if (!payload || controller.signal.aborted) return
        const event: StreamEvent = {
          name,
          chatId: payload.chat_id,
          messageId: payload.message_id,
          actorAccountId: payload.actor_account_id,
          affectedAccountIds: payload.affected_account_ids,
        }
        if (IMMEDIATE.has(name)) options.onTyping?.(event)
        else coalescer.push(event)
      },
    },
    { ...defaultDeps(), ...options.deps },
  )
  void connection.run().finally(() => {
    unwatch()
    coalescer.clear()
    if (reason !== null) options.onClosed?.(reason)
  })
  return { close: () => stop() }
}
