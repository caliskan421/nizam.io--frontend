import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

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
import type { ChatNotificationLevel, ChatNotificationLevelBody } from '../model/shared-types'
import { useChat, useChats } from './queries'
import { useSetChatNotificationLevel } from './notify-writes'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())
beforeEach(signIn)

let level: ChatNotificationLevel = 'all'
const detail = () => ({
  chat_id: 'c1',
  kind: 'group',
  name: 'Grup',
  notify_level: level,
})

function serve() {
  level = 'all'
  server.use(
    http.get(`${ORIGIN}/v1/chats`, () =>
      json({
        items: [{ ...detail(), unread_count: 4, last_message: null, mentioned: false }],
        next_cursor: '',
      }),
    ),
    http.get(`${ORIGIN}/v1/chats/c1`, () => json(detail())),
    http.put(`${ORIGIN}/v1/chats/c1/notification-level`, async ({ request }) => {
      level = ((await request.json()) as ChatNotificationLevelBody).level
      return json({ level })
    }),
  )
}

describe('setChatNotificationLevel', () => {
  it('PUT {level}: CSRF + program başlığı, anahtarsız; ayrıntı ve liste yeniden okunur; sayaç sunucudan aynen', async () => {
    serve()
    const m = mountSetup(() => ({
      chat: useChat('c1'),
      list: useChats(),
      set: useSetChatNotificationLevel(),
    }))
    await settleQueries(m.client)
    expect(m.result.chat.data.value?.notify_level).toBe('all')
    const outcome = await m.result.set.submit({ programId: 'p1', chatId: 'c1', level: 'none' })
    expect(outcome).toMatchObject({ kind: 'success' })
    const call = sent('PUT', '/v1/chats/c1/notification-level')[0]!
    expect(call.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(call.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(call.headers.get('Idempotency-Key')).toBeNull()
    await settleQueries(m.client)
    expect(m.result.chat.data.value?.notify_level).toBe('none')
    expect(sent('GET', '/v1/chats')).toHaveLength(2)
    // Okunmamış sayacı seviyeden bağımsızdır (K46/K54): sunucu cevabı aynen.
    expect(m.result.list.items.value[0]!.unread_count).toBe(4)
  })

  it('mentions seviyesi gönderilir; 404 ortak hata sonucu (yerel durum değişmez)', async () => {
    serve()
    server.use(
      http.put(`${ORIGIN}/v1/chats/c9/notification-level`, () =>
        errorEnvelope('messaging.chat_not_found', 404),
      ),
    )
    const m = mountSetup(() => ({ set: useSetChatNotificationLevel() }))
    await m.result.set.submit({ programId: 'p1', chatId: 'c1', level: 'mentions' })
    expect(level).toBe('mentions')
    const failed = await m.result.set.submit({ programId: 'p1', chatId: 'c9', level: 'none' })
    expect(failed.kind).not.toBe('success')
  })
})
