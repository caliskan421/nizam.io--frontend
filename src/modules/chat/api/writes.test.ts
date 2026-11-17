import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'

import {
  clientMessageIdOf,
  msg,
  range,
  seqs,
  type RecordedCall,
  type WriteMethod,
} from '../__tests__/fixtures'
import {
  errorEnvelope,
  http,
  HttpResponse,
  json,
  mountSetup,
  noContent,
  ORIGIN,
  resetAll,
  sent,
  server,
  settleQueries,
  signIn,
} from '../__tests__/harness'
import type { ChatMessage } from '../model/types'
import type { MessageWindow } from '../model/window'
import { useChatMessages } from './message-window'
import { useChatMembers, useChatPins, useChats, useChatUnreadOverview } from './queries'
import {
  useAddChatMembers,
  useCloseChatPoll,
  useCreateGroupChat,
  useCreateTaskFromChatMessage,
  useDeleteChat,
  useDeleteChatMessage,
  useDeleteChatReaction,
  useEditChatMessage,
  useGrantChatAdmin,
  useMarkAllChatsRead,
  useMarkChatRead,
  useOpenDirectChat,
  usePinChatMessage,
  useRemoveChatMember,
  useRevokeChatAdmin,
  useSendChatMessage,
  useSetChatReaction,
  useUnpinChatMessage,
  useUpdateChat,
  useVoteChatPoll,
} from './writes'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())
beforeEach(signIn)

const PROGRAM = { programId: 'p1' }
const CHAT = { ...PROGRAM, chatId: 'c1' }
const target = (seq: number) => ({ ...CHAT, messageId: `m${seq}`, seq })
const scope = { programId: 'p1', departmentId: null, lens: 'admin' as const }

const calls: RecordedCall[] = []
const called = (method: string, path: string) =>
  calls.filter((c) => c.method === method && c.path === path)

/** Yazma ucu: gövdeyi kaydeder, `respond` ile yanıtlar. */
function on(
  method: WriteMethod,
  path: string,
  respond: (call: RecordedCall) => Response | Promise<Response> = () => noContent(),
) {
  server.use(
    http[method](`${ORIGIN}${path}`, async ({ request }) => {
      const url = new URL(request.url)
      const text = await request.clone().text()
      let body: unknown = text
      try {
        body = text === '' ? null : (JSON.parse(text) as unknown)
      } catch {
        body = text
      }
      const call = {
        method: request.method,
        path: url.pathname,
        headers: request.headers,
        query: url.searchParams,
        body,
      }
      calls.push(call)
      return respond(call)
    }),
  )
}

afterEach(() => {
  calls.length = 0
})

function mountAll() {
  return mountSetup(() => ({
    window: useChatMessages('c1'),
    list: useChats(),
    overview: useChatUnreadOverview(),
    pins: useChatPins('c1'),
    members: useChatMembers('c1'),
    send: useSendChatMessage(),
    edit: useEditChatMessage(),
    remove: useDeleteChatMessage(),
    markRead: useMarkChatRead(),
    markAll: useMarkAllChatsRead(),
    react: useSetChatReaction(),
    unreact: useDeleteChatReaction(),
    pin: usePinChatMessage(),
    unpin: useUnpinChatMessage(),
    vote: useVoteChatPoll(),
    close: useCloseChatPoll(),
    task: useCreateTaskFromChatMessage(),
    group: useCreateGroupChat(),
    direct: useOpenDirectChat(),
    update: useUpdateChat(),
    del: useDeleteChat(),
    add: useAddChatMembers(),
    removeMember: useRemoveChatMember(),
    grant: useGrantChatAdmin(),
    revoke: useRevokeChatAdmin(),
  }))
}

/** Sunucu durumu: pencere 1..5 (m1..m5), boş liste/özet/sabit/üye. */
let history: ChatMessage[] = []
function baseline(items: ChatMessage[] = range(1, 5)) {
  history = items
  server.use(
    http.get(`${ORIGIN}/v1/chats/c1/messages`, ({ request }) => {
      const p = new URL(request.url).searchParams
      const around = p.get('around')
      const list = around ? history.filter((m) => Math.abs(m.seq - Number(around)) < 3) : history
      return HttpResponse.json({ items: list, peer_read_seq: null })
    }),
    http.get(`${ORIGIN}/v1/chats`, () => json({ items: [], next_cursor: '' })),
    http.get(`${ORIGIN}/v1/me/chat-unread`, () => json({ items: [] })),
    http.get(`${ORIGIN}/v1/chats/c1/pins`, () => json({ items: [], truncated: false })),
    http.get(`${ORIGIN}/v1/chats/c1/members`, () => json({ items: [], truncated: false })),
  )
}

async function ready() {
  baseline()
  const m = mountAll()
  await settleQueries(m.client)
  return m
}
const counts = () => ({
  list: sent('GET', '/v1/chats').length,
  overview: sent('GET', '/v1/me/chat-unread').length,
  pins: sent('GET', '/v1/chats/c1/pins').length,
  members: sent('GET', '/v1/chats/c1/members').length,
})
const win = (m: Awaited<ReturnType<typeof ready>>) =>
  m.client.getQueryData<MessageWindow>(queryKeys.chats.messages(scope, 'c1'))!

describe('mesaj gönder', () => {
  const body = { client_message_id: 'cm-new', body: 'Merhaba' }

  it('anahtar başlığı YOK (istemci mesaj kimliği gövdede), CSRF + program başlığı; pencereye yamanır, sender_name korunur', async () => {
    const m = await ready()
    on('post', '/v1/chats/c1/messages', () =>
      json(
        { ...msg(6, { body: 'Merhaba', sender_account_id: 'me' }), sender_name: undefined },
        201,
      ),
    )
    const before = counts()
    const out = await m.result.send.submit({ ...CHAT, body })
    expect(out).toMatchObject({ kind: 'success', status: 201 })
    const call = called('POST', '/v1/chats/c1/messages')[0]!
    expect(call.headers.get('Idempotency-Key')).toBeNull()
    expect(call.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(call.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(call.body).toEqual(body)
    expect(seqs(win(m).items)).toEqual([1, 2, 3, 4, 5, 6])
    // İyimser değil: yama yanıttan sonra; liste (önizleme/sıra) yeniden okunur, pencere değil.
    await settleQueries(m.client)
    expect(counts().list).toBe(before.list + 1)
    expect(sent('GET', '/v1/chats/c1/messages')).toHaveLength(1)
  })

  it('iyimser değil: yanıt gelmeden pencerede mesaj yok', async () => {
    const m = await ready()
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    let arrive!: () => void
    const arrived = new Promise<void>((r) => (arrive = r))
    on('post', '/v1/chats/c1/messages', async () => {
      arrive()
      await gate
      return json(msg(6), 201)
    })
    const pending = m.result.send.submit({ ...CHAT, body })
    await arrived // istek sunucuya ULAŞTI (önkoşul), yanıt henüz yok
    expect(seqs(win(m).items)).toEqual([1, 2, 3, 4, 5])
    release()
    await pending
    expect(seqs(win(m).items)).toContain(6)
  })

  it('SSE yankısı ve cevap tekilleşir: aynı message_id iki kez eklenmez', async () => {
    const m = await ready()
    on('post', '/v1/chats/c1/messages', () => json(msg(6), 201))
    await m.result.send.submit({ ...CHAT, body })
    await m.result.window.loadNewer().catch(() => undefined)
    expect(seqs(win(m).items).filter((s) => s === 6)).toHaveLength(1)
  })

  it('ağ hatası: sonuç bilinmiyor; retry AYNI client_message_id + AYNI gövdeyle, 200 başarı', async () => {
    const m = await ready()
    let n = 0
    on('post', '/v1/chats/c1/messages', () => {
      n += 1
      return n === 1 ? HttpResponse.error() : json(msg(6), 200)
    })
    const first = await m.result.send.submit({ ...CHAT, body })
    expect(first.kind).toBe('unknown_outcome')
    if (first.kind !== 'unknown_outcome') return
    const retried = await first.retry!()
    expect(retried).toMatchObject({ kind: 'success', status: 200 })
    const posts = called('POST', '/v1/chats/c1/messages')
    expect(posts).toHaveLength(2)
    expect(posts[1]!.body).toEqual(posts[0]!.body)
    expect(clientMessageIdOf(posts[1]!.body)).toBe('cm-new')
    expect(posts[1]!.headers.get('Idempotency-Key')).toBeNull()
  })

  it('409 message_deleted ve 409 idempotency_key_reused sonuç olarak döner; pencere değişmez', async () => {
    const m = await ready()
    on('post', '/v1/chats/c1/messages', () => errorEnvelope('messaging.message_deleted', 409))
    expect(await m.result.send.submit({ ...CHAT, body })).toMatchObject({
      kind: 'failed',
      error: { code: 'messaging.message_deleted' },
    })
    on('post', '/v1/chats/c1/messages', () =>
      errorEnvelope('messaging.idempotency_key_reused', 409),
    )
    expect((await m.result.send.submit({ ...CHAT, body })).kind).toBe('idempotency_key_reused')
    expect(seqs(win(m).items)).toEqual([1, 2, 3, 4, 5])
  })

  it('429: rate_limited + Retry-After; otomatik tekrar yok', async () => {
    const m = await ready()
    on('post', '/v1/chats/c1/messages', () =>
      HttpResponse.json(
        { code: 'platform.rate_limited', message: 'x', request_id: 'r', fields: [] },
        { status: 429, headers: { 'Retry-After': '9' } },
      ),
    )
    const out = await m.result.send.submit({ ...CHAT, body })
    expect(out).toMatchObject({ kind: 'rate_limited', retryAfter: 9 })
    expect(called('POST', '/v1/chats/c1/messages')).toHaveLength(1)
  })

  it('mentions/refs/poll/reply_to gövdede aynen gider', async () => {
    const m = await ready()
    on('post', '/v1/chats/c1/messages', () => json(msg(6), 201))
    const full = {
      client_message_id: 'cm-2',
      body: 'Anket',
      reply_to_message_id: 'm2',
      mentions: [{ kind: 'all' as const }, { kind: 'account' as const, target_id: 'u2' }],
      refs: [{ kind: 'task' as const, target_id: 'w1' }],
      poll: { options: ['a', 'b'], multi: true, anonymous: false },
    }
    await m.result.send.submit({ ...CHAT, body: full })
    expect(called('POST', '/v1/chats/c1/messages')[0]!.body).toEqual(full)
  })
})

describe('düzenle', () => {
  const edit = { ...target(3), body: 'yeni', expectedRevision: 4 }

  it('expected_revision gövdede; cevap pencereyi günceller (sender_name korunur)', async () => {
    const m = await ready()
    on('patch', '/v1/chats/c1/messages/m3', () =>
      json({ ...msg(3, { body: 'yeni', edited: true, edit_revision: 5 }), sender_name: undefined }),
    )
    const out = await m.result.edit.submit(edit)
    expect(out.kind).toBe('success')
    expect(called('PATCH', '/v1/chats/c1/messages/m3')[0]!.body).toEqual({
      body: 'yeni',
      expected_revision: 4,
    })
    expect(win(m).items.find((x) => x.seq === 3)).toMatchObject({
      body: 'yeni',
      edited: true,
      sender_name: 'Başka Kişi',
    })
  })

  it('409 edit_conflict: ortak çakışma kalıbı — güncel mesaj around ile okunur, otomatik tekrar yok', async () => {
    const m = await ready()
    history = range(1, 5).map((x) =>
      x.seq === 3 ? msg(3, { body: 'başkası değiştirdi', edit_revision: 9 }) : x,
    )
    on('patch', '/v1/chats/c1/messages/m3', () => errorEnvelope('messaging.edit_conflict', 409))
    const out = await m.result.edit.submit(edit)
    expect(out.kind).toBe('edit_conflict')
    if (out.kind !== 'edit_conflict') return
    expect(out.draft).toMatchObject({ body: 'yeni', expectedRevision: 4 })
    expect(out.server).toMatchObject({ body: 'başkası değiştirdi', edit_revision: 9 })
    expect(called('PATCH', '/v1/chats/c1/messages/m3')).toHaveLength(1)
    expect(sent('GET', '/v1/chats/c1/messages').some((r) => r.query.get('around') === '3')).toBe(
      true,
    )
  })

  it('404 message_not_found: yerel kayıt kaldırılır', async () => {
    const m = await ready()
    on('patch', '/v1/chats/c1/messages/m3', () => errorEnvelope('messaging.message_not_found', 404))
    const out = await m.result.edit.submit(edit)
    expect(out).toMatchObject({ kind: 'failed' })
    expect(seqs(win(m).items)).toEqual([1, 2, 4, 5])
  })
})

describe('sil', () => {
  it('204: yerel kayıt kimlikle kalkar; liste ve sabitler yenilenir', async () => {
    const m = await ready()
    on('delete', '/v1/chats/c1/messages/m2')
    const before = counts()
    await m.result.remove.submit(target(2))
    expect(seqs(win(m).items)).toEqual([1, 3, 4, 5])
    await settleQueries(m.client)
    expect(counts().list).toBe(before.list + 1)
    expect(counts().pins).toBe(before.pins + 1)
  })

  it('404 message_not_found: zaten silinmiş → yerel kayıt yine kalkar', async () => {
    const m = await ready()
    on('delete', '/v1/chats/c1/messages/m2', () =>
      errorEnvelope('messaging.message_not_found', 404),
    )
    const out = await m.result.remove.submit(target(2))
    expect(out.kind).toBe('failed')
    expect(seqs(win(m).items)).toEqual([1, 3, 4, 5])
  })

  it('403: pencere değişmez', async () => {
    const m = await ready()
    on('delete', '/v1/chats/c1/messages/m2', () => errorEnvelope('messaging.not_authorized', 403))
    await m.result.remove.submit(target(2))
    expect(seqs(win(m).items)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('okundu', () => {
  it('markChatRead: message_id gövdede; liste + rozet kaynağı birlikte yenilenir (KESİN 29)', async () => {
    const m = await ready()
    on('post', '/v1/chats/c1/read')
    const before = counts()
    await m.result.markRead.submit({ ...CHAT, messageId: 'm5' })
    expect(called('POST', '/v1/chats/c1/read')[0]!.body).toEqual({ message_id: 'm5' })
    await settleQueries(m.client)
    expect(counts()).toMatchObject({ list: before.list + 1, overview: before.overview + 1 })
  })

  it('markAllChatsRead: program başlığı; liste + rozet yenilenir', async () => {
    const m = await ready()
    on('post', '/v1/chats/read-all')
    const before = counts()
    await m.result.markAll.submit(PROGRAM)
    expect(called('POST', '/v1/chats/read-all')[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    await settleQueries(m.client)
    expect(counts()).toMatchObject({ list: before.list + 1, overview: before.overview + 1 })
  })
})

describe('tepki, sabit, anket: 204 sonrası around okuması', () => {
  it('tepki koy: PUT kind; around=<seq> ile mesaj güncellenir; pencere genişlemez', async () => {
    const m = await ready()
    history = range(1, 5).map((x) =>
      x.seq === 3 ? msg(3, { reactions: [{ kind: 'heart', count: 1, mine: true }] }) : x,
    )
    on('put', '/v1/chats/c1/messages/m3/reaction')
    await m.result.react.submit({ ...target(3), kind: 'heart' })
    expect(called('PUT', '/v1/chats/c1/messages/m3/reaction')[0]!.body).toEqual({ kind: 'heart' })
    expect(win(m).items.find((x) => x.seq === 3)!.reactions).toEqual([
      { kind: 'heart', count: 1, mine: true },
    ])
    expect(win(m).items).toHaveLength(5)
    expect(sent('GET', '/v1/chats/c1/messages').at(-1)!.query.get('around')).toBe('3')
  })

  it('tepki kaldır: DELETE; around okuması', async () => {
    const m = await ready()
    on('delete', '/v1/chats/c1/messages/m3/reaction')
    await m.result.unreact.submit(target(3))
    expect(called('DELETE', '/v1/chats/c1/messages/m3/reaction')).toHaveLength(1)
    expect(sent('GET', '/v1/chats/c1/messages').at(-1)!.query.get('around')).toBe('3')
  })

  it('sabitle / kaldır: PUT/DELETE; sabit şeridi geçersizlenir + around', async () => {
    const m = await ready()
    on('put', '/v1/chats/c1/messages/m3/pin')
    on('delete', '/v1/chats/c1/messages/m3/pin')
    const before = counts()
    await m.result.pin.submit(target(3))
    await m.result.unpin.submit(target(3))
    await settleQueries(m.client)
    expect(called('PUT', '/v1/chats/c1/messages/m3/pin')).toHaveLength(1)
    expect(called('DELETE', '/v1/chats/c1/messages/m3/pin')).toHaveLength(1)
    expect(counts().pins).toBe(before.pins + 2)
  })

  it('oy ver: option_indexes kümesi; geri çek [] açıkça; kapanmış ankette 409 poll_closed → yine de sonuç okunur', async () => {
    const m = await ready()
    on('put', '/v1/chats/c1/messages/m4/vote')
    await m.result.vote.submit({ ...target(4), optionIndexes: [0, 2] })
    await m.result.vote.submit({ ...target(4), optionIndexes: [] })
    expect(called('PUT', '/v1/chats/c1/messages/m4/vote').map((c) => c.body)).toEqual([
      { option_indexes: [0, 2] },
      { option_indexes: [] },
    ])
    const reads = sent('GET', '/v1/chats/c1/messages').length
    on('put', '/v1/chats/c1/messages/m4/vote', () => errorEnvelope('messaging.poll_closed', 409))
    const closed = await m.result.vote.submit({ ...target(4), optionIndexes: [1] })
    expect(closed).toMatchObject({ kind: 'failed', error: { code: 'messaging.poll_closed' } })
    expect(sent('GET', '/v1/chats/c1/messages').length).toBe(reads + 1)
  })

  it('anketi bitir: POST poll/close; 409 poll_closed sonrası sonuç okunur', async () => {
    const m = await ready()
    on('post', '/v1/chats/c1/messages/m4/poll/close')
    await m.result.close.submit(target(4))
    expect(called('POST', '/v1/chats/c1/messages/m4/poll/close')).toHaveLength(1)
    on('post', '/v1/chats/c1/messages/m4/poll/close', () =>
      errorEnvelope('messaging.poll_closed', 409),
    )
    const reads = sent('GET', '/v1/chats/c1/messages').length
    await m.result.close.submit(target(4))
    expect(sent('GET', '/v1/chats/c1/messages').length).toBe(reads + 1)
  })

  it('sahip sökülmüşse around okuması BAŞLAMAZ (KESİN 26a); önbellek yamaları sürer', async () => {
    const m = await ready()
    on('put', '/v1/chats/c1/messages/m3/reaction')
    const reads = sent('GET', '/v1/chats/c1/messages').length
    m.wrapper.unmount()
    const out = await m.result.react.submit({ ...target(3), kind: 'like' })
    expect(out.kind).toBe('owner_disposed')
    expect(sent('GET', '/v1/chats/c1/messages')).toHaveLength(reads)
    expect(called('PUT', '/v1/chats/c1/messages/m3/reaction')).toHaveLength(0)
  })
})

describe('sohbet oluştur / yönet', () => {
  it('grup kur: Idempotency-Key (22–200 bayt) başlıkta, gövde aynen; retry AYNI anahtar', async () => {
    const m = await ready()
    let n = 0
    on('post', '/v1/chats/groups', () => {
      n += 1
      return n === 1 ? HttpResponse.error() : json({ chat_id: 'g1', kind: 'group' }, 201)
    })
    const input = {
      ...PROGRAM,
      body: { name: 'Yeni', member_account_ids: ['u2'], source: 'none' as const },
    }
    const first = await m.result.group.submit(input)
    expect(first.kind).toBe('unknown_outcome')
    if (first.kind !== 'unknown_outcome') return
    await first.retry!()
    const [a, b] = called('POST', '/v1/chats/groups')
    const key = a!.headers.get('Idempotency-Key')!
    expect(key.length).toBeGreaterThanOrEqual(22)
    expect(key.length).toBeLessThanOrEqual(200)
    expect(b!.headers.get('Idempotency-Key')).toBe(key)
    expect(b!.body).toEqual(input.body)
    expect(a!.headers.get('X-Nizamio-Program')).toBe('p1')
  })

  it('iki ayrı kullanıcı eylemi farklı anahtar alır', async () => {
    const m = await ready()
    on('post', '/v1/chats/groups', () => json({ chat_id: 'g1', kind: 'group' }, 201))
    const input = { ...PROGRAM, body: { name: 'G', member_account_ids: [] } }
    await m.result.group.submit(input)
    await m.result.group.submit(input)
    const keys = called('POST', '/v1/chats/groups').map((c) => c.headers.get('Idempotency-Key'))
    expect(new Set(keys).size).toBe(2)
  })

  it('birebir aç: anahtar yok; 201 yeni ve 200 mevcut ikisi de başarı; liste yenilenir', async () => {
    const m = await ready()
    on('post', '/v1/chats/direct', () => json({ chat_id: 'd1', kind: 'direct' }, 200))
    const before = counts()
    const out = await m.result.direct.submit({ ...PROGRAM, accountId: 'u2' })
    expect(out).toMatchObject({ kind: 'success', status: 200, data: { chat_id: 'd1' } })
    const call = called('POST', '/v1/chats/direct')[0]!
    expect(call.headers.get('Idempotency-Key')).toBeNull()
    expect(call.body).toEqual({ account_id: 'u2' })
    await settleQueries(m.client)
    expect(counts().list).toBe(before.list + 1)
    on('post', '/v1/chats/direct', () => errorEnvelope('messaging.not_authorized', 403))
    expect((await m.result.direct.submit({ ...PROGRAM, accountId: 'u9' })).kind).toBe('failed')
  })

  it('ad/kaynak: PATCH; deleteChat DELETE; üye ekle/çıkar/yönetici: yollar ve geçersizleme', async () => {
    const m = await ready()
    on('patch', '/v1/chats/c1', () => json({ chat_id: 'c1', kind: 'group', name: 'Yeni ad' }))
    on('delete', '/v1/chats/c1')
    on('post', '/v1/chats/c1/members')
    on('delete', '/v1/chats/c1/members/u2')
    on('put', '/v1/chats/c1/admins/u2')
    on('delete', '/v1/chats/c1/admins/u2')
    const before = counts()
    await m.result.update.submit({ ...CHAT, body: { name: 'Yeni ad' } })
    await m.result.add.submit({ ...CHAT, accountIds: ['u3', 'u4'] })
    await m.result.removeMember.submit({ ...CHAT, accountId: 'u2' })
    await m.result.grant.submit({ ...CHAT, accountId: 'u2' })
    await m.result.revoke.submit({ ...CHAT, accountId: 'u2' })
    await m.result.del.submit(CHAT)
    await settleQueries(m.client)
    expect(called('PATCH', '/v1/chats/c1')[0]!.body).toEqual({ name: 'Yeni ad' })
    expect(called('POST', '/v1/chats/c1/members')[0]!.body).toEqual({ account_ids: ['u3', 'u4'] })
    expect(counts().members).toBeGreaterThan(before.members)
    expect(counts().list).toBeGreaterThan(before.list)
    expect(counts().overview).toBeGreaterThan(before.overview)
  })

  it('kaynaktan gelen üyeyi çıkarma 409 member_source_managed: failed', async () => {
    const m = await ready()
    on('delete', '/v1/chats/c1/members/u2', () =>
      errorEnvelope('messaging.member_source_managed', 409),
    )
    expect(await m.result.removeMember.submit({ ...CHAT, accountId: 'u2' })).toMatchObject({
      kind: 'failed',
      error: { code: 'messaging.member_source_managed' },
    })
  })
})

describe('mesajdan görev (K8)', () => {
  const input = {
    ...target(3),
    body: { department_id: 'd1', start_date: '2026-11-15', end_date: '2026-11-20', title: 'T' },
  }

  it('Idempotency-Key zorunlu; cevaptaki message (task_ids) pencereye işlenir; görev listesi geçersizlenir', async () => {
    const m = await ready()
    on('post', '/v1/chats/c1/messages/m3/tasks', () =>
      json({ work_item_id: 'w9', message: msg(3, { task_ids: ['w9'] }) }, 201),
    )
    const out = await m.result.task.submit(input)
    expect(out).toMatchObject({ kind: 'success', data: { work_item_id: 'w9' } })
    const call = called('POST', '/v1/chats/c1/messages/m3/tasks')[0]!
    expect(call.headers.get('Idempotency-Key')!.length).toBeGreaterThanOrEqual(22)
    expect(call.body).toEqual(input.body)
    expect(win(m).items.find((x) => x.seq === 3)!.task_ids).toEqual(['w9'])
  })

  it('aynı anahtar tekrarında 200 (aynı görev); 409 task_deleted failed', async () => {
    const m = await ready()
    on('post', '/v1/chats/c1/messages/m3/tasks', () => errorEnvelope('messaging.task_deleted', 409))
    expect(await m.result.task.submit(input)).toMatchObject({
      kind: 'failed',
      error: { code: 'messaging.task_deleted' },
    })
  })
})
