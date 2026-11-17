// W184: SSE olayı → paylaşılan sayı/ek/görev bağı/mesaj görevi/okundu sorgularının içeriksiz
// geçersizlenmesi (KESİN 34). Olay gövdesi önbelleğe yazılmaz; yalnız ilgili sohbetin okumaları yenilenir.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { QueryClient } from '@tanstack/vue-query'
import { ref } from 'vue'

import type { OpenResult } from '@/shared/sse'

import { range } from '../__tests__/fixtures'
import {
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
import { windowFromLatest } from '../model/window'
import {
  useChatAttachments,
  useChatMessageReceipts,
  useChatMessageTasks,
  useChatSharedCounts,
  useChatTaskLinks,
} from './shared-queries'
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
  return { body, push: (text: string) => controller.enqueue(enc.encode(text)) }
}
const frame = (name: string, chatId: string, messageId: string | null = null) =>
  `event: ${name}\ndata: ${JSON.stringify({
    chat_id: chatId,
    message_id: messageId,
    actor_account_id: 'u2',
    affected_account_ids: [],
  })}\n\n`

let client: QueryClient | null = null
async function tick(ms = 0) {
  await vi.advanceTimersByTimeAsync(ms)
  if (client) await settleQueries(client)
  await vi.advanceTimersByTimeAsync(0)
}

function serve() {
  server.use(
    http.get(`${ORIGIN}/v1/chats`, () => json({ items: [], next_cursor: '' })),
    http.get(`${ORIGIN}/v1/me/chat-unread`, () => json({ items: [] })),
    http.get(`${ORIGIN}/v1/chats/:id`, ({ params }) =>
      json({ chat_id: params.id, kind: 'group', role: 'member' }),
    ),
    http.get(`${ORIGIN}/v1/chats/:id/pins`, () => json({ items: [], truncated: false })),
    http.get(`${ORIGIN}/v1/chats/:id/shared-counts`, () =>
      json({ files: 0, attachments: 0, tasks: 0, polls: 0, departments: 0 }),
    ),
    http.get(`${ORIGIN}/v1/chats/:id/attachments`, () => json({ items: [], next_cursor: null })),
    http.get(`${ORIGIN}/v1/chats/:id/task-links`, () => json({ items: [], next_cursor: null })),
    http.get(`${ORIGIN}/v1/chats/:id/messages/m1/tasks`, () => json({ items: [] })),
    http.get(`${ORIGIN}/v1/chats/:id/messages/m1/receipts`, () =>
      json({ message_id: 'm1', seq: 1, truncated: false, read: [], unread: [] }),
    ),
  )
}

const n = (path: string) => sent('GET', path).length
const counts = () => ({
  shared: n('/v1/chats/c1/shared-counts'),
  attachments: n('/v1/chats/c1/attachments'),
  links: n('/v1/chats/c1/task-links'),
  tasks: n('/v1/chats/c1/messages/m1/tasks'),
  receipts: n('/v1/chats/c1/messages/m1/receipts'),
})

async function opened() {
  serve()
  const s = makeStream()
  const open = ref<string | null>('c1')
  const messages = {
    window: { value: windowFromLatest(range(1, 3), null) },
    loadNewer: vi.fn(() => Promise.resolve()),
    refreshMessage: vi.fn(() => Promise.resolve()),
    refreshPeerRead: vi.fn(() => Promise.resolve()),
    reconcile: vi.fn(() => Promise.resolve()),
  }
  const result: OpenResult = { kind: 'open', body: s.body }
  const m = mountSetup(() => ({
    shared: useChatSharedCounts('c1'),
    attachments: useChatAttachments('c1'),
    links: useChatTaskLinks('c1'),
    tasks: useChatMessageTasks('c1', 'm1'),
    receipts: useChatMessageReceipts('c1', 'm1'),
    other: useChatSharedCounts('c2'),
    stream: useChatStream({
      chatId: open,
      messages,
      deps: {
        transport: () => Promise.resolve(result),
        random: () => 0,
        isHidden: () => false,
        onVisibility: () => () => undefined,
      },
    }),
  }))
  client = m.client
  await tick(10)
  return { s, m }
}

describe('SSE → paylaşılan okumalar', () => {
  it('message.created: sayaç, ek ve görev bağı listeleri yenilenir (mesaj görevi/okundu değil; başka sohbet değil)', async () => {
    const { s } = await opened()
    const before = counts()
    const otherBefore = n('/v1/chats/c2/shared-counts')
    s.push(frame('message.created', 'c1', 'm9'))
    await tick(1200)
    const after = counts()
    expect(after.shared).toBe(before.shared + 1)
    expect(after.attachments).toBe(before.attachments + 1)
    expect(after.links).toBe(before.links + 1)
    expect(after.tasks).toBe(before.tasks)
    expect(after.receipts).toBe(before.receipts)
    expect(n('/v1/chats/c2/shared-counts')).toBe(otherBefore)
  })

  it('message.deleted: sayaç + listeler + görev kartı + okundu bilgisi yenilenir', async () => {
    const { s } = await opened()
    const before = counts()
    s.push(frame('message.deleted', 'c1', 'm1'))
    await tick(1200)
    const after = counts()
    expect(after.shared).toBe(before.shared + 1)
    expect(after.attachments).toBe(before.attachments + 1)
    expect(after.links).toBe(before.links + 1)
    expect(after.tasks).toBe(before.tasks + 1)
    expect(after.receipts).toBe(before.receipts + 1)
  })

  it('message.updated: yalnız mesaj görev kartları yenilenir', async () => {
    const { s } = await opened()
    const before = counts()
    s.push(frame('message.updated', 'c1', 'm1'))
    await tick(1200)
    const after = counts()
    expect(after.tasks).toBe(before.tasks + 1)
    expect(after.shared).toBe(before.shared)
    expect(after.receipts).toBe(before.receipts)
  })

  it('read.updated: okundu bilgisi yenilenir; pencerede okundu durumu okuması istenir', async () => {
    const { s } = await opened()
    const before = counts()
    s.push(frame('read.updated', 'c1'))
    await tick(1200)
    expect(counts().receipts).toBe(before.receipts + 1)
    expect(counts().shared).toBe(before.shared)
  })

  it('olay gövdesi önbelleğe yazılmaz: sayaç verisi yalnız HTTP cevabından', async () => {
    const { s, m } = await opened()
    s.push(frame('message.created', 'c1', 'm9'))
    await tick(1200)
    expect(m.result.shared.data.value).toEqual({
      files: 0,
      attachments: 0,
      tasks: 0,
      polls: 0,
      departments: 0,
    })
  })
})
