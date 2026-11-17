import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { ApiError } from '@/shared/errors/api-error'

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
import {
  useChatAttachments,
  useChatMessageReceipts,
  useChatMessageTasks,
  useChatSharedCounts,
  useChatTaskLinks,
} from './shared-queries'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())
beforeEach(signIn)

const attachment = (id: string, seq: number) => ({
  attachment_id: id,
  content_type: 'image/png',
  created_at: '2026-11-14T08:00:00Z',
  file_name: `${id}.png`,
  message_id: `m${seq}`,
  sender_account_id: 'u2',
  seq,
  size_bytes: 10,
})

describe('useChatSharedCounts', () => {
  it('S2: program başlığı; beş sayı sunucudan aynen (n+ işareti/istemci toplamı yok)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/chats/c1/shared-counts`, () =>
        json({ files: 2, attachments: 3, tasks: 1, polls: 0, departments: 4 }),
      ),
    )
    const m = mountSetup(() => useChatSharedCounts('c1'))
    await settleQueries(m.client)
    expect(m.result.data.value).toEqual({
      files: 2,
      attachments: 3,
      tasks: 1,
      polls: 0,
      departments: 4,
    })
    expect(sent('GET', '/v1/chats/c1/shared-counts')[0]!.headers.get('X-Nizamio-Program')).toBe(
      'p1',
    )
  })

  it('kapı kapalıyken ya da sohbet yokken istek yok', async () => {
    const id = ref<string | null>(null)
    const m = mountSetup(() => useChatSharedCounts(id, false))
    await settleQueries(m.client)
    expect(sent('GET', '/v1/chats/c1/shared-counts')).toHaveLength(0)
  })
})

describe('useChatAttachments / useChatTaskLinks', () => {
  it('ekler imleçle sayfalanır (limit=50, seq DESC sırası sunucudan)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/chats/c1/attachments`, ({ request }) =>
        new URL(request.url).searchParams.get('cursor') === 'k1'
          ? json({ items: [attachment('a1', 2)], next_cursor: null })
          : json({ items: [attachment('a3', 9), attachment('a2', 5)], next_cursor: 'k1' }),
      ),
    )
    const m = mountSetup(() => useChatAttachments('c1'))
    await settleQueries(m.client)
    expect(m.result.items.value.map((a) => a.attachment_id)).toEqual(['a3', 'a2'])
    expect(sent('GET', '/v1/chats/c1/attachments')[0]!.query.get('limit')).toBe('50')
    await m.result.query.fetchNextPage()
    expect(m.result.items.value.map((a) => a.attachment_id)).toEqual(['a3', 'a2', 'a1'])
    expect(m.result.query.hasNextPage.value).toBe(false)
  })

  it('görev bağları imleçle sayfalanır', async () => {
    const link = (id: string, seq: number) => ({
      created_at: '2026-11-14T08:00:00Z',
      message_id: `m${seq}`,
      seq,
      work_item_id: id,
    })
    server.use(
      http.get(`${ORIGIN}/v1/chats/c1/task-links`, ({ request }) =>
        new URL(request.url).searchParams.get('cursor') === 'k2'
          ? json({ items: [link('w1', 1)], next_cursor: null })
          : json({ items: [link('w2', 4)], next_cursor: 'k2' }),
      ),
    )
    const m = mountSetup(() => useChatTaskLinks('c1'))
    await settleQueries(m.client)
    await m.result.query.fetchNextPage()
    expect(m.result.items.value.map((l) => l.work_item_id)).toEqual(['w2', 'w1'])
  })
})

describe('useChatMessageTasks', () => {
  it('mesajın görevleri TEK istekle çözülür; getWorkItem yoklaması yok; forbidden/deleted başlık sızdırmaz', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/chats/c1/messages/m1/tasks`, () =>
        json({
          items: [
            {
              state: 'available',
              work_item_id: 'w1',
              task: {
                title: 'Rapor',
                status: 'open',
                code: 'YZ-3',
                sequence_no: 3,
                department_id: 'd1',
              },
            },
            { state: 'forbidden', work_item_id: 'w2', task: null },
            { state: 'deleted', work_item_id: 'w3', task: null },
          ],
        }),
      ),
    )
    const m = mountSetup(() => useChatMessageTasks('c1', 'm1'))
    await settleQueries(m.client)
    expect(m.result.data.value!.items.map((i) => i.state)).toEqual([
      'available',
      'forbidden',
      'deleted',
    ])
    expect(sent('GET', '/v1/chats/c1/messages/m1/tasks')).toHaveLength(1)
    expect(sent('GET', '/v1/work-items/w1')).toHaveLength(0)
  })
})

describe('useChatMessageReceipts', () => {
  it('okundu bilgisi: read/unread/truncated; başkasının mesajında 403 hata olarak kalır', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/chats/c1/messages/m1/receipts`, () =>
        json({
          message_id: 'm1',
          seq: 1,
          truncated: false,
          read: [{ account_id: 'u2', full_name: 'Ayşe', last_read_at: '2026-11-14T09:00:00Z' }],
          unread: [{ account_id: 'u3', full_name: 'Can' }],
        }),
      ),
      http.get(`${ORIGIN}/v1/chats/c1/messages/m2/receipts`, () =>
        errorEnvelope('messaging.forbidden', 403),
      ),
    )
    const mine = mountSetup(() => useChatMessageReceipts('c1', 'm1'))
    const theirs = mountSetup(() => useChatMessageReceipts('c1', 'm2'))
    await settleQueries(mine.client)
    await settleQueries(theirs.client)
    expect(mine.result.data.value!.read.map((r) => r.full_name)).toEqual(['Ayşe'])
    expect(theirs.result.error.value).toBeInstanceOf(ApiError)
    expect((theirs.result.error.value as ApiError).status).toBe(403)
  })

  it('mesaj kimliği yokken istek gitmez', async () => {
    const m = mountSetup(() => useChatMessageReceipts('c1', null))
    await settleQueries(m.client)
    expect(sent('GET', '/v1/chats/c1/messages/m1/receipts')).toHaveLength(0)
  })
})
