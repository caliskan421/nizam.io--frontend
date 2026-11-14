/**
 * Tek akışın yaşam döngüsü (istemci-akislari §10.5): açılış → okuma → kopuş → bekleme →
 * yeniden açılış. Sınıf, işlev boyu sınırı nedeniyle küçük yöntemlere bölünmüştür.
 *  - Ölü bağlantı: `SILENCE_MS` (50 sn; sunucu `: ping` 25 sn) çerçevesizlik → yeniden bağlan.
 *  - Gizli sekme: `HIDDEN_CLOSE_MS` (30 sn) sonra akış kapanır; görününce yeniden açılır.
 *  - 401 sonrası kalıcı red ve 403/422 → yeniden deneme yok (`onClosed`). 429 → `Retry-After`
 *    dolmadan deneme yok. 5xx/ağ → üstel bekleme + jitter.
 */
import { reconnectDelay } from './backoff'
import { createSseParser, type SseParser } from './parser'
import type { StreamTransport } from './transport'

export const SILENCE_MS = 50_000
export const HIDDEN_CLOSE_MS = 30_000

export type StreamState = 'connecting' | 'open' | 'waiting' | 'paused' | 'closed'
export type CloseReason = 'aborted' | 'unauthorized' | 'rejected'

export interface ConnectionHooks {
  onState: (state: StreamState) => void
  /** Veri çerçevesi (olay adı + ham JSON metni). */
  onFrame: (event: string, data: string) => void
  /** Akış açıldı; `reconnect` ilk açılıştan sonrakilerde `true` (uzlaştırma zamanı). */
  onOpen: (reconnect: boolean) => void
  onClosed: (reason: CloseReason) => void
}

export interface ConnectionDeps {
  transport: StreamTransport
  random: () => number
  isHidden: () => boolean
  /** Görünürlük değişimini dinler; döndürülen işlev dinlemeyi bırakır. */
  onVisibility: (listener: () => void) => () => void
}

type Ended = 'dropped' | 'fatal' | 'paused' | 'aborted' | 'throttled'

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve()
    const timer = setTimeout(done, ms)
    function done() {
      clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve()
    }
    signal.addEventListener('abort', done, { once: true })
  })
}

export class StreamConnection {
  #attempt = 0
  #opened = false
  #paused = false
  #retryAfterMs: number | null = null
  #current: AbortController | null = null
  #parser: SseParser
  #hiddenTimer: ReturnType<typeof setTimeout> | null = null
  #silenceTimer: ReturnType<typeof setTimeout> | null = null
  #offVisibility: () => void
  #wake: (() => void) | null = null

  constructor(
    readonly path: Parameters<StreamTransport>[0]['path'],
    readonly programId: string,
    readonly signal: AbortSignal,
    readonly hooks: ConnectionHooks,
    readonly deps: ConnectionDeps,
  ) {
    this.#parser = createSseParser({
      onFrame: (frame) => this.hooks.onFrame(frame.event, frame.data),
      onComment: () => this.#armSilence(),
    })
    this.#offVisibility = deps.onVisibility(() => this.#visibilityChanged())
    signal.addEventListener('abort', () => this.#stop(), { once: true })
  }

  async run(): Promise<void> {
    while (!this.signal.aborted) {
      const ended = await this.#connect()
      if (ended === 'aborted' || ended === 'fatal') break
      if (ended !== 'paused') await this.#backoff(ended)
      if (this.#paused) await this.#untilVisible()
    }
    this.#stop()
  }

  #stop(): void {
    this.#clearTimers()
    this.#offVisibility()
    this.#current?.abort()
    this.#wake?.()
    this.hooks.onState('closed')
  }

  #clearTimers(): void {
    if (this.#hiddenTimer) clearTimeout(this.#hiddenTimer)
    if (this.#silenceTimer) clearTimeout(this.#silenceTimer)
    this.#hiddenTimer = null
    this.#silenceTimer = null
  }

  #armSilence(): void {
    if (this.#silenceTimer) clearTimeout(this.#silenceTimer)
    this.#silenceTimer = setTimeout(() => this.#current?.abort(), SILENCE_MS)
  }

  #visibilityChanged(): void {
    if (this.deps.isHidden()) {
      if (this.#hiddenTimer === null) {
        this.#hiddenTimer = setTimeout(() => {
          this.#paused = true
          this.#current?.abort()
          this.#wake?.()
        }, HIDDEN_CLOSE_MS)
      }
      return
    }
    if (this.#hiddenTimer) clearTimeout(this.#hiddenTimer)
    this.#hiddenTimer = null
    this.#wake?.()
  }

  async #untilVisible(): Promise<void> {
    this.hooks.onState('paused')
    while (this.deps.isHidden() && !this.signal.aborted) {
      await new Promise<void>((resolve) => {
        this.#wake = resolve
      })
    }
    this.#wake = null
    this.#paused = false
  }

  async #backoff(ended: Ended): Promise<void> {
    this.hooks.onState('waiting')
    const base = reconnectDelay(this.#attempt, this.deps.random)
    const wait = ended === 'throttled' ? Math.max(base, this.#retryAfterMs ?? 0) : base
    this.#attempt += 1
    await delay(wait, this.signal)
  }

  async #connect(): Promise<Ended> {
    const controller = new AbortController()
    this.#current = controller
    const forward = () => controller.abort()
    this.signal.addEventListener('abort', forward, { once: true })
    this.hooks.onState('connecting')
    try {
      return await this.#openAndRead(controller)
    } catch {
      return this.#classifyAbort()
    } finally {
      this.signal.removeEventListener('abort', forward)
      this.#parser.reset()
      if (this.#silenceTimer) clearTimeout(this.#silenceTimer)
      this.#silenceTimer = null
    }
  }

  #classifyAbort(): Ended {
    if (this.signal.aborted) return 'aborted'
    return this.#paused ? 'paused' : 'dropped'
  }

  async #openAndRead(controller: AbortController): Promise<Ended> {
    const result = await this.deps.transport({
      path: this.path,
      programId: this.programId,
      signal: controller.signal,
      lastEventId: this.#parser.lastEventId,
    })
    if (result.kind === 'rejected') return this.#rejected(result.status, result.retryAfterMs)
    this.#attempt = 0
    const reconnect = this.#opened
    this.#opened = true
    this.hooks.onState('open')
    this.hooks.onOpen(reconnect)
    this.#armSilence()
    await this.#read(result.body, controller)
    return this.#classifyAbort()
  }

  #rejected(status: number, retryAfter: number | null): Ended {
    this.#retryAfterMs = retryAfter
    if (status === 401) return this.#fatal('unauthorized')
    if (status === 403 || status === 422 || status === 404) return this.#fatal('rejected')
    return status === 429 ? 'throttled' : 'dropped'
  }

  #fatal(reason: CloseReason): Ended {
    this.hooks.onClosed(reason)
    return 'fatal'
  }

  async #read(body: ReadableStream<Uint8Array>, controller: AbortController): Promise<void> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    const cancel = () => void reader.cancel().catch(() => undefined)
    controller.signal.addEventListener('abort', cancel, { once: true })
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) return
        this.#armSilence()
        this.#parser.feed(decoder.decode(value, { stream: true }))
      }
    } finally {
      controller.signal.removeEventListener('abort', cancel)
    }
  }
}
