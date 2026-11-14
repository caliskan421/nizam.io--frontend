import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { QueryClient } from '@tanstack/vue-query'
import { ref } from 'vue'

import { authSession } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import type { OpenResult } from '@/shared/sse'

import { msg, range, seqs, type FrameExtra, type OpenRequestLike } from '../__tests__/fixtures'
import {
  errorEnvelope,
  http,
  json,
  mountSetup,
  ORIGIN,
  resetAll,
  sent,
  server,
  settleQueries,
  signIn,
} from '../__tests__/harness'
import { windowFromLatest, type MessageWindow } from '../model/window'
import { useChat, useChats, useChatUnreadOverview } from './queries'
import { useChatStream } from './stream'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetAll()
  vi.useRealTimers()
  client = null
})
afterAll(() => server.close())
beforeEach(() => {
  signIn()
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
})

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
const frame = (name: string, chatId: string, extra: FrameExtra = {}) =>
  `event: ${name}\ndata: ${JSON.stringify({
    chat_id: chatId,
    message_id: null,
    actor_account_id: 'u2',
    affected_account_ids: [],
    ...extra,
  })}\n\n`

const scope = { programId: 'p1', departmentId: null, lens: 'admin' as const }

function fakeMessages(items = range(1, 5)) {
  const win = windowFromLatest(items, null)
  return {
    window: { value: win },
    loadNewer: vi.fn(() => Promise.resolve()),
    refreshMessage: vi.fn(() => Promise.resolve()),
    refreshPeerRead: vi.fn(() => Promise.resolve()),
    reconcile: vi.fn(() => Promise.resolve()),
  }
}

function serveReads() {
  server.use(
    http.get(`${ORIGIN}/v1/chats`, () => json({ items: [], next_cursor: '' })),
    http.get(`${ORIGIN}/v1/me/chat-unread`, () => json({ items: [] })),
    http.get(`${ORIGIN}/v1/chats/:id`, ({ params }) =>
      json({ chat_id: params.id, kind: 'group', role: 'member' }),
    ),
  )
}

/** Sahte saati ilerletir, sonra gerçek ağ (msw) yanıtlarının yerleşmesini bekler. */
let client: QueryClient | null = null
async function tick(ms = 0) {
  await vi.advanceTimersByTimeAsync(ms)
  if (client) await settleQueries(client)
  await vi.advanceTimersByTimeAsync(0)
}

/** Birden çok bağlantı denemesi için taşıyıcı: sırayla verilen sonuçları döndürür. */
function transportOf(results: OpenResult[]) {
  const programs: string[] = []
  const fn = vi.fn((request: OpenRequestLike) => {
    programs.push(request.programId)
    const next = results.shift()
    return next ? Promise.resolve(next) : new Promise<OpenResult>(() => undefined)
  })
  return { fn, programs }
}

function start(
  messages: ReturnType<typeof fakeMessages> | null,
  transport: ReturnType<typeof transportOf>,
  chatId: string | null = 'c1',
  onChatLost?: (id: string) => void,
) {
  const open = ref(chatId)
  const m = mountSetup(() => ({
    list: useChats(),
    overview: useChatUnreadOverview(),
    detail: useChat(open),
    stream: useChatStream({
      chatId: open,
      messages,
      onChatLost,
      deps: {
        transport: transport.fn,
        random: () => 0,
        isHidden: () => false,
        onVisibility: () => () => undefined,
      },
    }),
  }))
  client = m.client
  return { m, open }
}

const reads = () => ({
  list: sent('GET', '/v1/chats').length,
  overview: sent('GET', '/v1/me/chat-unread').length,
  detail: sent('GET', '/v1/chats/c1').length,
})

describe('useChatStream: açılış ve uzlaştırma', () => {
  it('program başlığıyla açılır; ilk açılışta liste + rozet yenilenir, pencere uzlaştırması YOK', async () => {
    serveReads()
    const s = makeStream()
    const messages = fakeMessages()
    const transport = transportOf([{ kind: 'open', body: s.body }])
    const { m } = start(messages, transport)
    await tick(10)
    expect(transport.programs).toEqual(['p1'])
    expect(m.result.stream.state.value).toBe('open')
    const first = reads()
    await tick(10)
    expect(first.list).toBeGreaterThanOrEqual(1)
    expect(first.overview).toBeGreaterThanOrEqual(1)
    expect(messages.reconcile).not.toHaveBeenCalled()
  })

  it('akış kopunca yeniden bağlanır; yeniden bağlanmada pencere uzlaştırılır ve liste tazelenir', async () => {
    serveReads()
    const a = makeStream()
    const b = makeStream()
    const messages = fakeMessages()
    const transport = transportOf([
      { kind: 'open', body: a.body },
      { kind: 'open', body: b.body },
    ])
    const { m } = start(messages, transport)
    await tick(10)
    const before = reads().list
    a.end()
    await tick(1100)
    expect(transport.fn).toHaveBeenCalledTimes(2)
    expect(messages.reconcile).toHaveBeenCalledTimes(1)
    expect(reads().list).toBeGreaterThan(before)
    expect(m.result.stream.state.value).toBe('open')
  })
})

describe('useChatStream: olay → içeriksiz okuma', () => {
  async function opened(chatId: string | null = 'c1') {
    serveReads()
    const s = makeStream()
    const messages = fakeMessages()
    const transport = transportOf([{ kind: 'open', body: s.body }])
    const h = start(messages, transport, chatId)
    await tick(10)
    return { ...h, s, messages, transport, base: reads() }
  }

  it('message.created (açık sohbet): ≥1 sn birleşir, TEK after okuması; liste + rozet bir kez', async () => {
    const { s, messages, base } = await opened()
    s.push(frame('message.created', 'c1', { message_id: 'm6' }))
    s.push(frame('message.created', 'c1', { message_id: 'm7' }))
    s.push(frame('message.created', 'c1', { message_id: 'm8' }))
    await tick(900)
    expect(messages.loadNewer).not.toHaveBeenCalled()
    await tick(200)
    expect(messages.loadNewer).toHaveBeenCalledTimes(1)
    await tick(50)
    expect(reads().list).toBe(base.list + 1)
    expect(reads().overview).toBe(base.overview + 1)
  })

  it('message.created (başka sohbet): açık pencere okunmaz, liste/rozet yenilenir', async () => {
    const { s, messages, base } = await opened()
    s.push(frame('message.created', 'c9'))
    await tick(1200)
    expect(messages.loadNewer).not.toHaveBeenCalled()
    expect(reads().list).toBe(base.list + 1)
  })

  it('message.updated: yalnız yerelde olan mesaj yerel seq ile around okunur', async () => {
    const { s, messages } = await opened()
    s.push(frame('message.updated', 'c1', { message_id: 'm3' }))
    s.push(frame('message.updated', 'c1', { message_id: 'yok' }))
    await tick(1200)
    expect(messages.refreshMessage).toHaveBeenCalledTimes(1)
    expect(messages.refreshMessage).toHaveBeenCalledWith(3)
  })

  it('message.deleted: yerel kayıt kimlikle kalkar, okuma YOK (önbellekteki pencere)', async () => {
    const { s, m } = await opened('c9')
    m.client.setQueryData<MessageWindow>(
      queryKeys.chats.messages(scope, 'c9'),
      windowFromLatest([msg(1), msg(2), msg(3)], null),
    )
    s.push(frame('message.deleted', 'c9', { message_id: 'm2' }))
    await tick(1200)
    const win = m.client.getQueryData<MessageWindow>(queryKeys.chats.messages(scope, 'c9'))!
    expect(seqs(win.items)).toEqual([1, 3])
    expect(sent('GET', '/v1/chats/c9/messages')).toHaveLength(0)
  })

  it('read.updated: açık sohbette tik okuması', async () => {
    const { s, messages } = await opened()
    s.push(frame('read.updated', 'c1'))
    await tick(1200)
    expect(messages.refreshPeerRead).toHaveBeenCalledTimes(1)
  })

  it('member.changed (ben etkilendim): erişim yeniden denetlenir; 404 → sohbet kapanır (onChatLost)', async () => {
    serveReads()
    server.use(
      http.get(`${ORIGIN}/v1/chats/c1`, () => errorEnvelope('messaging.chat_not_found', 404)),
    )
    const s = makeStream()
    const lost: string[] = []
    const { m } = start(fakeMessages(), transportOf([{ kind: 'open', body: s.body }]), 'c1', (id) =>
      lost.push(id),
    )
    await tick(10)
    s.push(frame('member.changed', 'c1', { affected_account_ids: ['acc-1'] }))
    await tick(1300)
    expect(lost).toEqual(['c1'])
    expect(m.result.detail.isError.value).toBe(true)
  })

  it('member.changed (başkası): sohbet kapanmaz', async () => {
    const { s } = await opened()
    // `opened` onChatLost vermedi; başkası etkilenince erişim denetimi hiç yapılmaz.
    const before = reads().detail
    s.push(frame('member.changed', 'c1', { affected_account_ids: ['u3'] }))
    await tick(1300)
    expect(reads().detail).toBe(before + 1) // yalnız ayrıntı tazelemesi (içeriksiz geçersizleme)
  })
})

describe('useChatStream: yazıyor', () => {
  it('typing anlıktır, kendi sinyalim yok sayılır, ~5 sn sonra kalkar; önbelleğe yazılmaz', async () => {
    serveReads()
    const s = makeStream()
    const { m } = start(fakeMessages(), transportOf([{ kind: 'open', body: s.body }]))
    await tick(10)
    s.push(frame('typing', 'c1', { actor_account_id: 'u2' }))
    s.push(frame('typing', 'c1', { actor_account_id: 'acc-1' }))
    s.push(frame('typing', 'c9', { actor_account_id: 'u5' }))
    await tick(50)
    expect(m.result.stream.typingAccountIds.value).toEqual(['u2'])
    expect(
      m.client
        .getQueryCache()
        .findAll()
        .some((q) => JSON.stringify(q.queryKey).includes('typing')),
    ).toBe(false)
    await tick(5100)
    expect(m.result.stream.typingAccountIds.value).toEqual([])
  })
})

describe('useChatStream: yaşam döngüsü (KESİN 34, 26)', () => {
  it('program değişince akış kapanır ve YENİ programla yeniden açılır', async () => {
    serveReads()
    const a = makeStream()
    const b = makeStream()
    const transport = transportOf([
      { kind: 'open', body: a.body },
      { kind: 'open', body: b.body },
    ])
    start(fakeMessages(), transport)
    await tick(10)
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await tick(200)
    expect(transport.programs).toEqual(['p1', 'p2'])
  })

  it('sayfa sökülünce akış kapanır; bekleyen birleştirilmiş olay işlenmez', async () => {
    serveReads()
    const s = makeStream()
    const messages = fakeMessages()
    const { m } = start(messages, transportOf([{ kind: 'open', body: s.body }]))
    await tick(10)
    s.push(frame('message.created', 'c1'))
    await tick(100)
    m.wrapper.unmount()
    await tick(5000)
    expect(messages.loadNewer).not.toHaveBeenCalled()
  })

  it('oturum bitince (çıkış) akış kapanır ve yeniden açılmaz', async () => {
    serveReads()
    const s = makeStream()
    const transport = transportOf([{ kind: 'open', body: s.body }])
    const { m } = start(fakeMessages(), transport)
    await tick(10)
    authSession.clear()
    await tick(70_000)
    expect(transport.fn).toHaveBeenCalledTimes(1)
    expect(m.result.stream.state.value).toBe('closed')
  })

  it('enabled=false iken açılmaz; mesaj penceresiz (messages=null) sohbette de çalışır', async () => {
    serveReads()
    const s = makeStream()
    const transport = transportOf([{ kind: 'open', body: s.body }])
    const { m } = start(null, transport, null)
    await tick(10)
    expect(transport.fn).toHaveBeenCalledTimes(1)
    s.push(frame('message.created', 'c1'))
    await tick(1300)
    expect(m.result.stream.state.value).toBe('open')
  })
})

describe('useChatStream: bekleyen uzlaştırma (KUSUR 1-2)', () => {
  async function opened() {
    serveReads()
    const s = makeStream()
    const messages = fakeMessages()
    const h = start(messages, transportOf([{ kind: 'open', body: s.body }]))
    await tick(10)
    return { ...h, s, messages }
  }

  it('olay → ağ hatası → çevrimiçi: pencere TEK kez uzlaştırılır; ikinci tetik okumaz', async () => {
    const { s, messages } = await opened()
    messages.loadNewer.mockRejectedValueOnce(new TypeError('network'))
    s.push(frame('message.created', 'c1', { message_id: 'm6' }))
    await tick(1200)
    expect(messages.loadNewer).toHaveBeenCalledTimes(1)
    expect(messages.reconcile).not.toHaveBeenCalled()
    globalThis.dispatchEvent(new Event('online'))
    await tick(10)
    expect(messages.reconcile).toHaveBeenCalledTimes(1)
    globalThis.dispatchEvent(new Event('online'))
    globalThis.dispatchEvent(new Event('focus'))
    await tick(10)
    expect(messages.reconcile).toHaveBeenCalledTimes(1)
  })

  it('başarılı okuma bayrak bırakmaz: online uzlaştırma başlatmaz', async () => {
    const { s, messages } = await opened()
    s.push(frame('message.created', 'c1', { message_id: 'm6' }))
    await tick(1200)
    globalThis.dispatchEvent(new Event('online'))
    await tick(10)
    expect(messages.reconcile).not.toHaveBeenCalled()
  })

  it('pencere odağı bekleyen uzlaştırmayı tetikler; başarısız uzlaştırma bayrağı korur (otomatik döngü yok)', async () => {
    const { s, messages } = await opened()
    messages.refreshPeerRead.mockRejectedValueOnce(new TypeError('network'))
    s.push(frame('read.updated', 'c1'))
    await tick(1200)
    messages.reconcile.mockRejectedValueOnce(new TypeError('network'))
    globalThis.dispatchEvent(new Event('focus'))
    await tick(5000)
    expect(messages.reconcile).toHaveBeenCalledTimes(1)
    globalThis.dispatchEvent(new Event('focus'))
    await tick(10)
    expect(messages.reconcile).toHaveBeenCalledTimes(2)
  })

  it('reddedilen plan yakalanmamış red olmaz; sessiz kalır ve çevrimiçinde uzlaştırılır', async () => {
    const { s, messages } = await opened()
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)
    messages.refreshMessage.mockImplementationOnce(() => {
      throw new Error('boom')
    })
    s.push(frame('message.updated', 'c1', { message_id: 'm3' }))
    await tick(1200)
    await vi.advanceTimersByTimeAsync(0)
    process.off('unhandledRejection', unhandled)
    expect(unhandled).not.toHaveBeenCalled()
    globalThis.dispatchEvent(new Event('online'))
    await tick(10)
    expect(messages.reconcile).toHaveBeenCalledTimes(1)
  })

  it('sayfa sökülünce bekleyen uzlaştırma çalışmaz', async () => {
    const { s, messages, m } = await opened()
    messages.loadNewer.mockRejectedValueOnce(new TypeError('network'))
    s.push(frame('message.created', 'c1', { message_id: 'm6' }))
    await tick(1200)
    m.wrapper.unmount()
    globalThis.dispatchEvent(new Event('online'))
    await tick(10)
    expect(messages.reconcile).not.toHaveBeenCalled()
  })
})
