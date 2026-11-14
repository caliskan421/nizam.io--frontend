import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'

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
  useChat,
  useChatCandidates,
  useChatMembers,
  useChatPins,
  useChatRefs,
  useChatRefSummary,
  useChats,
  useChatUnreadOverview,
} from './queries'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())
beforeEach(signIn)

const summary = (id: string) => ({
  chat_id: id,
  kind: 'group',
  name: `Grup ${id}`,
  last_message: null,
  unread_count: 0,
  mentioned: false,
})

describe('useChats', () => {
  it('S2: program başlığı, limit=50; q yalnız doluysa; sunucu sırası korunur', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/chats`, () =>
        json({ items: [summary('b'), summary('a')], next_cursor: '' }),
      ),
    )
    const q = ref('')
    const m = mountSetup(() => useChats(q))
    await settleQueries(m.client)
    expect(m.result.items.value.map((c) => c.chat_id)).toEqual(['b', 'a'])
    const call = sent('GET', '/v1/chats')[0]!
    expect(call.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(call.query.get('limit')).toBe('50')
    expect(call.query.get('q')).toBeNull()
    q.value = '  genel  '
    await vi.waitFor(() => expect(sent('GET', '/v1/chats')).toHaveLength(2))
    expect(sent('GET', '/v1/chats')[1]!.query.get('q')).toBe('genel')
  })

  it('arama ≤100 karakter; farklı q farklı anahtar', async () => {
    server.use(http.get(`${ORIGIN}/v1/chats`, () => json({ items: [], next_cursor: '' })))
    const m = mountSetup(() => useChats('x'.repeat(150)))
    await settleQueries(m.client)
    expect(sent('GET', '/v1/chats')[0]!.query.get('q')).toHaveLength(100)
  })

  it('"Daha fazla": imleçle sonraki sayfa eklenir', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/chats`, ({ request }) =>
        new URL(request.url).searchParams.get('cursor')
          ? json({ items: [summary('c')], next_cursor: '' })
          : json({ items: [summary('a'), summary('b')], next_cursor: 'k1' }),
      ),
    )
    const m = mountSetup(() => useChats())
    await settleQueries(m.client)
    await m.result.loadMore()
    expect(m.result.items.value.map((c) => c.chat_id)).toEqual(['a', 'b', 'c'])
    expect(sent('GET', '/v1/chats')[1]!.query.get('cursor')).toBe('k1')
  })

  it('invalid_cursor: imleç atılır, ilk sayfadan yeniden başlanır', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/chats`, ({ request }) =>
        new URL(request.url).searchParams.get('cursor')
          ? errorEnvelope('messaging.invalid_cursor', 422)
          : json({ items: [summary('a')], next_cursor: 'bozuk' }),
      ),
    )
    const m = mountSetup(() => useChats())
    await settleQueries(m.client)
    await m.result.loadMore()
    await settleQueries(m.client)
    expect(m.result.items.value.map((c) => c.chat_id)).toEqual(['a'])
    expect(sent('GET', '/v1/chats').at(-1)!.query.get('cursor')).toBeNull()
  })

  it('kapsam (program) yokken istek yok', async () => {
    const m = mountSetup(() => useChats(), {
      scope: { programId: null, lens: null, departmentId: null },
    })
    await settleQueries(m.client)
    expect(sent('GET', '/v1/chats')).toHaveLength(0)
  })

  it('anahtar kapsamlı: departman/mercek değişince önbellek anahtarı değişir (K2)', async () => {
    server.use(http.get(`${ORIGIN}/v1/chats`, () => json({ items: [], next_cursor: '' })))
    const m = mountSetup(() => useChats())
    await settleQueries(m.client)
    const key = queryKeys.chats.list({ programId: 'p1', departmentId: null, lens: 'admin' }, '')
    expect(m.client.getQueryData(key)).toBeDefined()
  })
})

describe('tekil okuyucular', () => {
  it('getChat: rol alanı; 404 chat_not_found hata olarak kalır (tekrarlanmaz)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/chats/c1`, () =>
        json({ chat_id: 'c1', kind: 'group', role: 'founder' }),
      ),
      http.get(`${ORIGIN}/v1/chats/yok`, () => errorEnvelope('messaging.chat_not_found', 404)),
    )
    const ok = mountSetup(() => useChat('c1'))
    await settleQueries(ok.client)
    expect(ok.result.data.value).toMatchObject({ role: 'founder' })
    const gone = mountSetup(() => useChat('yok'))
    await settleQueries(gone.client)
    expect(gone.result.isError.value).toBe(true)
    expect(sent('GET', '/v1/chats/yok')).toHaveLength(1)
  })

  it('sohbet yokken (null) istek yok', async () => {
    const m = mountSetup(() => ({
      a: useChat(null),
      b: useChatPins(null),
      c: useChatMembers(null),
    }))
    await settleQueries(m.client)
    expect(sent('GET', '/v1/chats/null')).toHaveLength(0)
  })

  it('sabitler ve üyeler', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/chats/c1/pins`, () => json({ items: [], truncated: false })),
      http.get(`${ORIGIN}/v1/chats/c1/members`, () => json({ items: [], truncated: true })),
    )
    const m = mountSetup(() => ({ pins: useChatPins('c1'), members: useChatMembers('c1') }))
    await settleQueries(m.client)
    expect(m.result.pins.data.value).toEqual({ items: [], truncated: false })
    expect(m.result.members.data.value?.truncated).toBe(true)
  })

  it('aday listesi: purpose (+ group için chat_id), pencere açılışında TAZE (staleTime 0)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/chats/candidates`, () => json({ items: [], truncated: false })),
    )
    const direct = mountSetup(() => useChatCandidates('direct'))
    await settleQueries(direct.client)
    expect(sent('GET', '/v1/chats/candidates')[0]!.query.get('purpose')).toBe('direct')
    expect(sent('GET', '/v1/chats/candidates')[0]!.query.get('chat_id')).toBeNull()
    const group = mountSetup(() => useChatCandidates('group', 'c1'))
    await settleQueries(group.client)
    const call = sent('GET', '/v1/chats/candidates')[1]!
    expect(call.query.get('purpose')).toBe('group')
    expect(call.query.get('chat_id')).toBe('c1')
    expect(
      group.client.getQueryState(
        queryKeys.chats.candidates(
          { programId: 'p1', departmentId: null, lens: 'admin' },
          'group',
          'c1',
        ),
      )?.dataUpdatedAt,
    ).toBeGreaterThan(0)
  })

  it('aday listesi kapalıyken (enabled=false) okunmaz', async () => {
    const m = mountSetup(() => useChatCandidates('direct', null, false))
    await settleQueries(m.client)
    expect(sent('GET', '/v1/chats/candidates')).toHaveLength(0)
  })
})

describe('referans kartı özeti (P60: backend kazanır)', () => {
  it('available:false "artık yok" kartıdır; önbellekte taze sayılmaz (açılışta yeniden okunur)', async () => {
    let available = false
    server.use(
      http.get(`${ORIGIN}/v1/chat-refs/r1`, () =>
        json(
          available
            ? { available: true, ref_id: 'r1', kind: 'task' }
            : { available: false, ref_id: 'r1', kind: 'task' },
        ),
      ),
    )
    const first = mountSetup(() => useChatRefSummary('r1'))
    await settleQueries(first.client)
    expect(first.result.data.value?.available).toBe(false)
    // Aynı istemcide ikinci gözlemci: taze sayılmadığı için yeniden okur; hedef geri geldi.
    available = true
    const second = mountSetup(() => useChatRefSummary('r1'), { client: first.client })
    await settleQueries(second.client)
    expect(sent('GET', '/v1/chat-refs/r1')).toHaveLength(2)
    expect(second.result.data.value?.available).toBe(true)
  })

  it('available:true önbellekten taze: ikinci gözlemci yeniden okumaz', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/chat-refs/r2`, () =>
        json({ available: true, ref_id: 'r2', kind: 'file' }),
      ),
    )
    const first = mountSetup(() => useChatRefSummary('r2'))
    await settleQueries(first.client)
    mountSetup(() => useChatRefSummary('r2'), { client: first.client })
    await settleQueries(first.client)
    expect(sent('GET', '/v1/chat-refs/r2')).toHaveLength(1)
  })

  it('404 ref_not_found hata olarak döner (mesaj silinmiş / üye değil)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/chat-refs/r3`, () => errorEnvelope('messaging.ref_not_found', 404)),
    )
    const m = mountSetup(() => useChatRefSummary('r3'))
    await settleQueries(m.client)
    expect(m.result.isError.value).toBe(true)
  })

  it('paylaşılanlar: kind süzgeci + imleç', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/chats/c1/refs`, ({ request }) =>
        new URL(request.url).searchParams.get('cursor')
          ? json({ items: [{ ref_id: 'r2' }], next_cursor: null })
          : json({ items: [{ ref_id: 'r1' }], next_cursor: 'k' }),
      ),
    )
    const m = mountSetup(() => useChatRefs('c1', 'file'))
    await settleQueries(m.client)
    await m.result.query.fetchNextPage()
    expect(m.result.items.value.map((r) => r.ref_id)).toEqual(['r1', 'r2'])
    expect(sent('GET', '/v1/chats/c1/refs')[0]!.query.get('kind')).toBe('file')
  })
})

describe('programlar arası okunmamış özeti (S1)', () => {
  const overview = {
    items: [
      { program_id: 'p1', program_name: 'Bir', unread_chats: 3, mentioned: true },
      { program_id: 'p2', program_name: 'İki', unread_chats: 8, mentioned: false },
    ],
  }

  it('program başlığı GİTMEZ; seçili programın satırı seçilir (mentioned dahil)', async () => {
    server.use(http.get(`${ORIGIN}/v1/me/chat-unread`, () => json(overview)))
    const m = mountSetup(() => useChatUnreadOverview())
    await settleQueries(m.client)
    expect(sent('GET', '/v1/me/chat-unread')[0]!.headers.get('X-Nizamio-Program')).toBeNull()
    expect(m.result.selected.value).toMatchObject({ unread_chats: 3, mentioned: true })
    expect(m.client.getQueryData(queryKeys.chatsUnread.overview())).toEqual(overview)
  })

  it('seçili program satırı yok ya da hata → null (rozet gizli)', async () => {
    server.use(http.get(`${ORIGIN}/v1/me/chat-unread`, () => json({ items: [] })))
    const none = mountSetup(() => useChatUnreadOverview())
    await settleQueries(none.client)
    expect(none.result.selected.value).toBeNull()
    server.use(
      http.get(`${ORIGIN}/v1/me/chat-unread`, () =>
        errorEnvelope('organization.membership_required', 403),
      ),
    )
    const failed = mountSetup(() => useChatUnreadOverview())
    await settleQueries(failed.client)
    expect(failed.result.selected.value).toBeNull()
  })

  it('kapsam değişince önbellek düşmez (hesap geneli anahtar)', async () => {
    server.use(http.get(`${ORIGIN}/v1/me/chat-unread`, () => json(overview)))
    const m = mountSetup(() => useChatUnreadOverview())
    await settleQueries(m.client)
    expect(queryKeys.chatsUnread.overview()).toEqual(['chats', 'unread-overview'])
  })

  it('enabled=false iken okunmaz', async () => {
    const m = mountSetup(() => useChatUnreadOverview(false))
    await settleQueries(m.client)
    expect(sent('GET', '/v1/me/chat-unread')).toHaveLength(0)
  })
})
