import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

import { HIDDEN_CLOSE_MS, SILENCE_MS } from './connection'
import { openEventStream, type OpenEventStreamOptions } from './open-event-stream'
import type { CoalescedEvent, StreamEvent } from './coalesce'
import type { OpenResult, StreamTransport } from './transport'

const enc = new TextEncoder()

function makeStream() {
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c
    },
  })
  return {
    body,
    push: (text: string) => controller.enqueue(enc.encode(text)),
    end: () => controller.close(),
  }
}

const frame = (name: string, chatId: string, messageId: string | null = null) =>
  `event: ${name}\ndata: ${JSON.stringify({
    chat_id: chatId,
    message_id: messageId,
    actor_account_id: 'u1',
    affected_account_ids: [],
  })}\n\n`

interface Harness {
  events: CoalescedEvent[]
  typing: StreamEvent[]
  opens: boolean[]
  closed: string[]
  states: string[]
  calls: number
  stop: () => void
  hidden: { value: boolean }
  fireVisibility: () => void
}

function start(transport: StreamTransport, extra: Partial<OpenEventStreamOptions> = {}): Harness {
  const controller = new AbortController()
  const hidden = { value: false }
  const listeners = new Set<() => void>()
  const h: Harness = {
    events: [],
    typing: [],
    opens: [],
    closed: [],
    states: [],
    calls: 0,
    stop: () => controller.abort(),
    hidden,
    fireVisibility: () => listeners.forEach((l) => l()),
  }
  const counted: StreamTransport = (request) => {
    h.calls += 1
    return transport(request)
  }
  openEventStream({
    path: '/v1/chats/stream',
    programId: 'p1',
    signal: controller.signal,
    onEvent: (e) => h.events.push(e),
    onTyping: (e) => h.typing.push(e),
    onOpen: ({ reconnect }) => h.opens.push(reconnect),
    onState: (s) => h.states.push(s),
    onClosed: (r) => h.closed.push(r),
    deps: {
      transport: counted,
      random: () => 0,
      isHidden: () => hidden.value,
      onVisibility: (l) => {
        listeners.add(l)
        return () => listeners.delete(l)
      },
    },
    ...extra,
  })
  return h
}

const open = (body: ReadableStream<Uint8Array>): OpenResult => ({ kind: 'open', body })

describe('openEventStream', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })
  afterEach(() => vi.useRealTimers())

  it('olayı ≥1 sn birleştirir, typing anlık gelir, tek toplu olay üretir', async () => {
    const s = makeStream()
    const h = start(() => Promise.resolve(open(s.body)))
    await vi.advanceTimersByTimeAsync(0)
    s.push(': ok\n\n')
    s.push(frame('message.created', 'c1', 'm1') + frame('message.created', 'c1', 'm2'))
    s.push(frame('typing', 'c1'))
    await vi.advanceTimersByTimeAsync(10)
    expect(h.typing).toHaveLength(1)
    expect(h.events).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(1000)
    expect(h.events).toHaveLength(1)
    expect(h.events[0]).toMatchObject({ chatId: 'c1', messageIds: ['m1', 'm2'], count: 2 })
    expect(h.opens).toEqual([false])
    h.stop()
  })

  it('bozuk veri çerçevesi yok sayılır', async () => {
    const s = makeStream()
    const h = start(() => Promise.resolve(open(s.body)))
    await vi.advanceTimersByTimeAsync(0)
    s.push('event: message.created\ndata: {bozuk\n\n')
    s.push('event: message.created\ndata: {"x":1}\n\n')
    await vi.advanceTimersByTimeAsync(1500)
    expect(h.events).toEqual([])
    h.stop()
  })

  it('akış kapanınca 1 sn (jitter 0) sonra yeniden bağlanır ve reconnect=true bildirir', async () => {
    const first = makeStream()
    const second = makeStream()
    const bodies = [first.body, second.body]
    const h = start(() => Promise.resolve(open(bodies.shift()!)))
    await vi.advanceTimersByTimeAsync(0)
    first.end()
    await vi.advanceTimersByTimeAsync(999)
    expect(h.calls).toBe(1)
    await vi.advanceTimersByTimeAsync(2)
    expect(h.calls).toBe(2)
    expect(h.opens).toEqual([false, true])
    h.stop()
  })

  it('art arda başarısız açılışta bekleme üstel artar; başarıda sıfırlanır', async () => {
    const ok = makeStream()
    let n = 0
    const h = start(() => {
      n += 1
      if (n <= 3) return Promise.reject(new Error('ağ'))
      return Promise.resolve(open(ok.body))
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(h.calls).toBe(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(h.calls).toBe(2)
    await vi.advanceTimersByTimeAsync(2000)
    expect(h.calls).toBe(3)
    await vi.advanceTimersByTimeAsync(4000)
    expect(h.calls).toBe(4)
    expect(h.opens).toEqual([false])
    ok.end()
    await vi.advanceTimersByTimeAsync(1001)
    expect(h.calls).toBe(5)
    h.stop()
  })

  it('50 sn çerçevesizlikte bağlantıyı ölü sayıp yeniden bağlanır; ping süreyi uzatır', async () => {
    const a = makeStream()
    const b = makeStream()
    const bodies = [a.body, b.body]
    const h = start(() => Promise.resolve(open(bodies.shift()!)))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(SILENCE_MS - 1000)
    a.push(': ping\n\n')
    await vi.advanceTimersByTimeAsync(SILENCE_MS - 1000)
    expect(h.calls).toBe(1)
    await vi.advanceTimersByTimeAsync(1100)
    await vi.advanceTimersByTimeAsync(1100)
    expect(h.calls).toBe(2)
    h.stop()
  })

  it('401 kalıcıysa yeniden denemez; 403 de öyle; 429 Retry-After dolmadan denemez', async () => {
    const h401 = start(() => Promise.resolve({ kind: 'rejected', status: 401, retryAfterMs: null }))
    await vi.advanceTimersByTimeAsync(60_000)
    expect(h401.calls).toBe(1)
    expect(h401.closed).toEqual(['unauthorized'])

    const h403 = start(() => Promise.resolve({ kind: 'rejected', status: 403, retryAfterMs: null }))
    await vi.advanceTimersByTimeAsync(60_000)
    expect(h403.calls).toBe(1)
    expect(h403.closed).toEqual(['rejected'])

    const ok = makeStream()
    let n = 0
    const h429 = start(() => {
      n += 1
      return Promise.resolve(
        n === 1 ? { kind: 'rejected', status: 429, retryAfterMs: 20_000 } : open(ok.body),
      )
    })
    await vi.advanceTimersByTimeAsync(19_000)
    expect(h429.calls).toBe(1)
    await vi.advanceTimersByTimeAsync(1_500)
    expect(h429.calls).toBe(2)
    h429.stop()
  })

  it('signal iptali akışı kapatır, bekleyen birleştirmeyi teslim etmez, yeniden bağlanmaz', async () => {
    const s = makeStream()
    const h = start(() => Promise.resolve(open(s.body)))
    await vi.advanceTimersByTimeAsync(0)
    s.push(frame('message.created', 'c1', 'm1'))
    await vi.advanceTimersByTimeAsync(10)
    h.stop()
    await vi.advanceTimersByTimeAsync(120_000)
    expect(h.events).toEqual([])
    expect(h.calls).toBe(1)
    expect(h.states.at(-1)).toBe('closed')
  })

  it('program değişince akış kapanır (scope), bekleyen olay teslim edilmez', async () => {
    const store = useScopeStore()
    store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    const s = makeStream()
    const h = start(() => Promise.resolve(open(s.body)))
    await vi.advanceTimersByTimeAsync(0)
    s.push(frame('message.created', 'c1', 'm1'))
    await vi.advanceTimersByTimeAsync(10)
    store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await vi.advanceTimersByTimeAsync(5000)
    expect(h.closed).toEqual(['scope'])
    expect(h.events).toEqual([])
    expect(h.calls).toBe(1)
  })

  it('aynı programda departman değişimi akışı kapatmaz', async () => {
    const store = useScopeStore()
    store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    const s = makeStream()
    const h = start(() => Promise.resolve(open(s.body)))
    await vi.advanceTimersByTimeAsync(0)
    store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    await vi.advanceTimersByTimeAsync(5000)
    expect(h.closed).toEqual([])
    h.stop()
  })

  it('oturum nesli değişince (çıkış) akış kapanır', async () => {
    const s = makeStream()
    const h = start(() => Promise.resolve(open(s.body)))
    await vi.advanceTimersByTimeAsync(0)
    authSession.clear()
    await vi.advanceTimersByTimeAsync(5000)
    expect(h.closed).toEqual(['session'])
    expect(h.calls).toBe(1)
  })

  it('sekme 30 sn gizli kalırsa kapanır; görününce yeniden açılır (reconnect)', async () => {
    const a = makeStream()
    const b = makeStream()
    const bodies = [a.body, b.body]
    const h = start(() => Promise.resolve(open(bodies.shift()!)))
    await vi.advanceTimersByTimeAsync(0)
    h.hidden.value = true
    h.fireVisibility()
    await vi.advanceTimersByTimeAsync(HIDDEN_CLOSE_MS - 1000)
    expect(h.states.at(-1)).toBe('open')
    await vi.advanceTimersByTimeAsync(1500)
    expect(h.states.at(-1)).toBe('paused')
    await vi.advanceTimersByTimeAsync(60_000)
    expect(h.calls).toBe(1)
    h.hidden.value = false
    h.fireVisibility()
    await vi.advanceTimersByTimeAsync(10)
    expect(h.calls).toBe(2)
    expect(h.opens).toEqual([false, true])
    h.stop()
  })

  it('30 sn dolmadan görünür olursa akış kesilmez', async () => {
    const a = makeStream()
    const h = start(() => Promise.resolve(open(a.body)))
    await vi.advanceTimersByTimeAsync(0)
    h.hidden.value = true
    h.fireVisibility()
    await vi.advanceTimersByTimeAsync(10_000)
    h.hidden.value = false
    h.fireVisibility()
    a.push(': ping\n\n')
    await vi.advanceTimersByTimeAsync(HIDDEN_CLOSE_MS + 5000)
    expect(h.calls).toBe(1)
    expect(h.states.at(-1)).toBe('open')
    h.stop()
  })
})
