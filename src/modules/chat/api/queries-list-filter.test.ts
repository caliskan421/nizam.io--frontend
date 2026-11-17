import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'

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
import type { ChatListFilter } from '../model/types'
import { useChats } from './queries'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())
beforeEach(signIn)

const row = (id: string, kind: string) => ({
  chat_id: id,
  kind,
  name: kind === 'group' ? id : null,
  last_message: null,
  unread_count: 0,
  mentioned: false,
})

/** Durumlu sahte uç: `kind`/`unread` süzgecini ve imleci sunucu gibi uygular. */
function fakeList() {
  const all = [row('g1', 'group'), row('d1', 'direct'), row('g2', 'group')]
  server.use(
    http.get(`${ORIGIN}/v1/chats`, ({ request }) => {
      const p = new URL(request.url).searchParams
      const kind = p.get('kind')
      const matched = all.filter((c) => (kind ? c.kind === kind : true))
      const items = p.get('cursor') ? matched.slice(1) : matched.slice(0, 1)
      return json({ items, next_cursor: p.get('cursor') ? '' : 'k1', total: matched.length })
    }),
  )
}

describe('useChats — sunucu süzgeci (BE-081)', () => {
  it('kind/unread sunucuya gider; "Tümü"de ikisi de gönderilmez', async () => {
    fakeList()
    const filter = ref<ChatListFilter>({})
    const m = mountSetup(() => useChats('', filter))
    await settleQueries(m.client)
    const first = sent('GET', '/v1/chats')[0]!
    expect(first.query.get('kind')).toBeNull()
    expect(first.query.get('unread')).toBeNull()
    filter.value = { kind: 'group' }
    await vi.waitFor(() => expect(sent('GET', '/v1/chats')).toHaveLength(2))
    expect(sent('GET', '/v1/chats')[1]!.query.get('kind')).toBe('group')
    filter.value = { unread: true }
    await vi.waitFor(() => expect(sent('GET', '/v1/chats')).toHaveLength(3))
    const third = sent('GET', '/v1/chats')[2]!
    expect(third.query.get('unread')).toBe('true')
    expect(third.query.get('kind')).toBeNull()
  })

  it('süzgeç tam anahtardadır ve imleç yeni süzgeçte sıfırdan başlar', async () => {
    fakeList()
    const filter = ref<ChatListFilter>({})
    const m = mountSetup(() => useChats('', filter))
    await settleQueries(m.client)
    await m.result.loadMore()
    expect(sent('GET', '/v1/chats')[1]!.query.get('cursor')).toBe('k1')
    filter.value = { kind: 'direct' }
    await vi.waitFor(() => expect(sent('GET', '/v1/chats')).toHaveLength(3))
    expect(sent('GET', '/v1/chats')[2]!.query.get('cursor')).toBeNull()
    const scope = { programId: 'p1', departmentId: null, lens: 'admin' } as const
    const tumu = queryKeys.chats.list(scope, '')
    const kisiler = queryKeys.chats.list(scope, '', 'direct')
    const okunmamis = queryKeys.chats.list(scope, '', null, true)
    expect(JSON.stringify(kisiler)).not.toBe(JSON.stringify(tumu))
    expect(JSON.stringify(okunmamis)).not.toBe(JSON.stringify(tumu))
    expect(m.client.getQueryData(tumu)).toBeDefined()
    expect(m.client.getQueryData(kisiler)).toBeDefined()
  })

  it('süzülmüş `total` ilk sayfadan okunur (istemci sayımı yok)', async () => {
    fakeList()
    const m = mountSetup(() => useChats('', { kind: 'group' }))
    await settleQueries(m.client)
    expect(m.result.query.data.value?.pages[0]?.total).toBe(2)
    expect(m.result.items.value).toHaveLength(1)
  })
})
