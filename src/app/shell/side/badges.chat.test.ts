// Mesajlar rozeti (F7, E-00-21; KESİN 29): yazma sonrası türev sayaç önce/sonra. Gerçek istemci +
// MSW; rozet kaynağı `getChatUnreadOverview` (S1, hesap geneli), okundu yazmaları rozeti yeniler.
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { useMarkAllChatsRead, useMarkChatRead } from '@/modules/chat/public'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { authSession } from '@/shared/http'

import { createFakeLifecycle, setupWithScope, sideContext } from './__tests__/fake-lifecycle'
import { useTaskBadges } from './badges'

const ORIGIN = 'http://localhost'
const state = { p1: { unread: 3, mentioned: true }, p2: { unread: 9, mentioned: false } }
let overviewReads = 0
const idle = () => Promise.resolve({ overdue_tasks: 0, pending_date_changes: 0 })
const noCounts = () => Promise.resolve({ overdue: 0, pending_date_requests: 0 })

const server = setupServer(
  http.get(`${ORIGIN}/v1/me/chat-unread`, ({ request }) => {
    overviewReads += 1
    expect(request.headers.get('X-Nizamio-Program')).toBeNull()
    return HttpResponse.json({
      items: [
        {
          program_id: 'p1',
          program_name: 'Bir',
          unread_chats: state.p1.unread,
          mentioned: state.p1.mentioned,
        },
        {
          program_id: 'p2',
          program_name: 'İki',
          unread_chats: state.p2.unread,
          mentioned: state.p2.mentioned,
        },
      ],
    })
  }),
  http.post(`${ORIGIN}/v1/chats/c1/read`, () => {
    state.p1 = { unread: 2, mentioned: false }
    return new HttpResponse(null, { status: 204 })
  }),
  http.post(`${ORIGIN}/v1/chats/read-all`, () => {
    state.p1 = { unread: 0, mentioned: false }
    return new HttpResponse(null, { status: 204 })
  }),
  http.get(`${ORIGIN}/v1/chats`, () => HttpResponse.json({ items: [], next_cursor: '' })),
)

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  overviewReads = 0
  state.p1 = { unread: 3, mentioned: true }
})
afterAll(() => server.close())
beforeEach(() => {
  authSession.establish({
    token: 'tok-1',
    account_id: 'acc-1',
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    force_password_change: false,
  } as never)
})

async function boot(lens: 'admin' | 'coordinator' | 'member') {
  const ctx = await sideContext()
  const { lifecycle, store } = createFakeLifecycle({
    facts: {
      companyAdmin: lens === 'admin',
      coordinator: lens === 'coordinator',
      member: lens === 'member',
    },
  })
  store.commit({ programId: 'p1', lens, departmentId: lens === 'admin' ? null : 'd1' })
  const probe = setupWithScope(ctx, lifecycle, () => ({
    badges: useTaskBadges('F7', idle, noCounts).badges,
    read: useMarkChatRead(),
    readAll: useMarkAllChatsRead(),
  }))
  await settleQueries(ctx.queryClient)
  return { ...probe, ctx, store }
}

describe('Mesajlar rozeti — hesap geneli özet, seçili program satırı', () => {
  it.each(['admin', 'coordinator', 'member'] as const)(
    '%s merceği: seçili programın okunmamış sohbet sayısı + @ vurgusu (mercek rozeti değiştirmez)',
    async (lens) => {
      const { badges } = await boot(lens)
      expect(badges.value).toMatchObject({ unreadChats: 3, unreadMentioned: true })
    },
  )

  it('okundu yazması rozeti önce/sonra: markChatRead → 3 → 2, vurgu kalkar; markAll → rozet gizli', async () => {
    const { badges, read, readAll, ctx } = await boot('admin')
    expect(badges.value.unreadChats).toBe(3)
    const reads = overviewReads
    await read.submit({ programId: 'p1', chatId: 'c1', messageId: 'm9' })
    await settleQueries(ctx.queryClient)
    expect(overviewReads).toBe(reads + 1)
    expect(badges.value).toMatchObject({ unreadChats: 2, unreadMentioned: false })
    await readAll.submit({ programId: 'p1' })
    await settleQueries(ctx.queryClient)
    expect(badges.value).toMatchObject({ unreadChats: null, unreadMentioned: false })
  })

  it('program değişince rozet başka programın satırına geçer (aynı özet, ek istek yok)', async () => {
    const { badges, store, ctx } = await boot('admin')
    const reads = overviewReads
    store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await settleQueries(ctx.queryClient)
    expect(badges.value).toMatchObject({ unreadChats: 9, unreadMentioned: false })
    expect(overviewReads).toBe(reads)
  })

  it('F7 öncesi fazda Mesajlar öğesi canlı değil: özet istenmez', async () => {
    const ctx = await sideContext()
    const { lifecycle, store } = createFakeLifecycle()
    store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    const { badges } = setupWithScope(ctx, lifecycle, () => useTaskBadges('F6', idle, noCounts))
    await settleQueries(ctx.queryClient)
    expect(overviewReads).toBe(0)
    expect(badges.value.unreadChats).toBeNull()
  })
})
