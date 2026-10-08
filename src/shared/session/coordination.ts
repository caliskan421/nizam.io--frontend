import type { SessionMessage } from './messages'

/**
 * Sekmeler arası yenileme koordinasyonu: özel kilit + belirteç yayını. Tarayıcıda Web Locks
 * API ve BroadcastChannel; testlerde paylaşılan sahte kilit/kanal verilir.
 */
export interface RefreshCoordination {
  /** Kilit gerçekten sekmeler arası mı (Web Locks var mı)? */
  readonly crossTabLock: boolean
  withLock<T>(name: string, task: () => Promise<T>): Promise<T>
  publish(message: SessionMessage): void
  /** Dinleyici HAM veriyi alır; doğrulama alıcıda yapılır (messages.ts). */
  subscribe(listener: (raw: unknown) => void): void
}

export const SESSION_CHANNEL_NAME = 'nizamio:session'

type LockManagerLike = {
  request<T>(name: string, options: { mode: 'exclusive' }, task: () => Promise<T>): Promise<T>
}

/**
 * Tarayıcı koordinasyonu. `navigator.locks` yalnız güvenli bağlamda (https veya localhost)
 * vardır; yoksa yalnız sekme içi tekilleştirme kalır ve BroadcastChannel ile backend'in 10 sn
 * rotasyon payı yarışı karşılar (bkz. docs/refresh-coordination.md).
 */
export function browserCoordination(): RefreshCoordination {
  const locks = (globalThis.navigator as { locks?: LockManagerLike } | undefined)?.locks
  const channel =
    typeof BroadcastChannel === 'function' ? new BroadcastChannel(SESSION_CHANNEL_NAME) : null
  return {
    crossTabLock: locks !== undefined,
    withLock: (name, task) => (locks ? locks.request(name, { mode: 'exclusive' }, task) : task()),
    publish: (message) => channel?.postMessage(message),
    subscribe: (listener) => {
      channel?.addEventListener('message', (event: MessageEvent<unknown>) => listener(event.data))
    },
  }
}
