// W160 · O3 senaryo 2: SSE — sahte `ReadableStream` sunucusu: `message.created` (başka sohbet → yalnız
// liste; açık sohbet → pencere), yerel yama + olay çakışması, `read.updated`, `member.changed`
// (kendi hesabım çıkarıldı → `getChat` 404 → listeye dön), `typing` (önbelleğe yazılmaz, söner),
// yeniden bağlanma + `reconcile`, program/oturum değişiminde kapanma, gizli sekme, 401 tek
// refresh, akış yalnız `/mesajlar` açıkken. Gerçek süre yok: sahte saat (`advance`).
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  ADMIN,
  advance,
  boot,
  chat,
  chatOf,
  dropStreams,
  fakeClock,
  GROUP,
  idle,
  MEMBER,
  messageEls,
  peerSays,
  pressEnter,
  resetChats,
  rowEls,
  sent,
  serverEmit,
  streamCalls,
  liveStreams,
  streamOpen,
  streamRequests,
  watchStreams,
  switchScope,
  teardown,
  typeText,
  until,
  useChatBackend,
  userClick,
  WHO,
} from './chat-support'

const backend = useChatBackend({ coordinator: 'koordinator', member: 'uye' })
const texts = () => messageEls().map((el) => el.querySelector('.chat-bub')?.textContent ?? '')
const sub = () => $('.chat-thread__sub')?.textContent ?? ''

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetChats()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
  await until(() => messageEls().length > 0, 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  watchStreams()
  resetChats()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  vi.spyOn(Math, 'random').mockReturnValue(0)
})
afterEach(() => {
  vi.useRealTimers()
  teardown()
})
afterAll(() => backend.server.close())

describe('akış yaşam döngüsü', () => {
  it('akış yalnız /mesajlar açıkken açılır; başka sayfada 0 istek, çıkınca kapanır', async () => {
    const app = await boot({ ...MEMBER, path: '/gorevler' })
    await idle(app.queryClient)
    fakeClock()
    expect(streamRequests()).toHaveLength(0)
    await app.router.push('/mesajlar')
    await streamOpen()
    expect(streamRequests()).toHaveLength(1)
    expect(streamRequests()[0]!.program).toBe('p1')
    expect(streamRequests()[0]!.authorization).toMatch(/^Bearer /)
    await app.router.push('/gorevler')
    await until(() => liveStreams().length === 0, 'akış kapandı')
    await advance(70_000)
    expect(streamRequests()).toHaveLength(1)
    expect(streamCalls[0]!.aborted).toBe(true)
  })

  it('program değişince akış kapanır, yeni programda açılır (yönetici p1 → p2)', async () => {
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    fakeClock()
    await streamOpen()
    expect(streamRequests().at(-1)!.program).toBe('p1')
    await switchScope('Program', 'Teknofest 2027')
    await until(() => liveStreams().some((c) => c.program === 'p2'), 'p2 akışı')
    expect(liveStreams()).toHaveLength(1)
    expect(streamCalls.find((c) => c.program === 'p1')!.aborted).toBe(true)
    expect(streamRequests().at(-1)!.program).toBe('p2')
    await idle(app.queryClient)
  })

  it('oturum kapanınca akış kapanır ve yeniden açılmaz', async () => {
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    fakeClock()
    await streamOpen()
    await app.session.logout()
    await until(() => liveStreams().length === 0, 'akış kapandı')
    await advance(70_000)
    expect(liveStreams()).toHaveLength(0)
    expect(streamRequests()).toHaveLength(1)
  })

  it('gizli sekme 30 sn → akış kapanır; görününce yeniden açılır ve uzlaştırılır', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    fakeClock()
    await streamOpen()
    const hidden = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    await advance(29_000)
    expect(liveStreams()).toHaveLength(1)
    await advance(1_500)
    await until(() => liveStreams().length === 0, 'gizli sekmede kapandı')
    peerSays(GROUP, 'second', 'Sekme gizliyken yazıldı')
    hidden.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await streamOpen()
    await until(() => texts().some((t) => t.includes('Sekme gizliyken yazıldı')), 'uzlaştırma')
    await idle(app.queryClient)
    expect(streamRequests()).toHaveLength(2)
  })

  it('401 → tek refresh → akış bir kez daha açılır (ikinci istek yeni belirteçle)', async () => {
    chat.state.stream401 = 1
    backend.server.use(
      http.post('http://localhost/v1/auth/refresh', () => {
        backend.db.tokens.set('tok-yeni-0000000001', WHO.member.account_id)
        return HttpResponse.json({
          token: 'tok-yeni-0000000001',
          account_id: WHO.member.account_id,
          expires_at: Math.floor(Date.now() / 1000) + 900,
          refresh_expires_at: 0,
        })
      }),
    )
    fakeClock()
    await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => streamRequests().length >= 1, 'ilk istek 401')
    // Kardeş sekme bekleme süreleri (150 ms eşitleme + 1 sn akran) sahte saatle ilerletilir.
    await advance(150)
    await advance(1000)
    await streamOpen()
    expect(sent('POST', '/v1/auth/refresh')).toHaveLength(1)
    expect(streamRequests()).toHaveLength(2)
    expect(streamRequests().map((c) => c.status)).toEqual([401, 200])
    expect(streamRequests()[1]!.authorization).toBe('Bearer tok-yeni-0000000001')
  })
})

describe('olaylar', () => {
  it('message.created: başka sohbet → yalnız liste (mesaj okuması yok); açık sohbet → pencere (after=60)', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    fakeClock()
    await streamOpen()
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    const reads = () => sent('GET', `/v1/chats/${GROUP}/messages`).length
    const lists = () => sent('GET', '/v1/chats').length
    const before = { reads: reads(), lists: lists() }
    peerSays('dm1', 'second', 'Cem: ikinci mesaj')
    await advance(1000)
    await idle(app.queryClient)
    expect(lists()).toBeGreaterThan(before.lists)
    expect(reads()).toBe(before.reads)
    expect(sent('GET', '/v1/chats/dm1/messages')).toHaveLength(0)
    expect($('[data-chat-id="dm1"] .chat-row__badge')?.textContent?.trim()).toBe('2')

    peerSays(GROUP, 'second', 'Açık sohbete yeni mesaj')
    peerSays(GROUP, 'second', 'Ve bir tane daha')
    await advance(1000)
    await until(() => texts().some((t) => t.includes('Ve bir tane daha')), 'yeni mesajlar')
    await idle(app.queryClient)
    const after = sent('GET', `/v1/chats/${GROUP}/messages`).filter((r) => r.query.has('after'))
    expect(after).toHaveLength(1)
    expect(after[0]!.query.get('after')).toBe('60')
  })

  it('yerel yama + olay çakışması: kendi gönderimim olay gelince çift balon olmaz', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    fakeClock()
    await streamOpen()
    await until(() => messageEls().length > 0, 'mesajlar')
    await typeText('Yerel yama')
    await pressEnter()
    await until(() => texts().some((t) => t.includes('Yerel yama')), 'yerel balon')
    await advance(1000)
    await idle(app.queryClient)
    expect(texts().filter((t) => t.includes('Yerel yama'))).toHaveLength(1)
    const after = sent('GET', `/v1/chats/${GROUP}/messages`).filter((r) => r.query.has('after'))
    expect(after.at(-1)?.query.get('after')).toBe('61')
  })

  it('message.updated / message.deleted: düzenleme `around` ile okunur; silinen mesaj okumasız kalkar', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    fakeClock()
    await streamOpen()
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    const target = chatOf(GROUP).messages.find((m) => m.base.seq === 58)!
    Object.assign(target.base, {
      body: 'Mekanik mesaj 58 (düzeltildi)',
      edit_revision: 2,
      edited: true,
    })
    serverEmit(GROUP, 'message.updated', {
      messageId: target.base.message_id,
      actor: WHO.coord.account_id,
    })
    await advance(1000)
    await until(() => texts().some((t) => t.includes('58 (düzeltildi)')), 'düzenleme')
    const around = sent('GET', `/v1/chats/${GROUP}/messages`).filter(
      (r) => r.query.get('around') === '58',
    )
    expect(around).toHaveLength(1)

    const gone = chatOf(GROUP).messages.find((m) => m.base.seq === 57)!
    chatOf(GROUP).messages = chatOf(GROUP).messages.filter((m) => m !== gone)
    const reads = sent('GET', `/v1/chats/${GROUP}/messages`).length
    serverEmit(GROUP, 'message.deleted', {
      messageId: gone.base.message_id,
      actor: WHO.coord.account_id,
    })
    await advance(1000)
    await until(() => !texts().some((t) => t.includes('Mekanik mesaj 57')), 'silinen kalktı')
    await idle(app.queryClient)
    expect(sent('GET', `/v1/chats/${GROUP}/messages`)).toHaveLength(reads)
  })

  it('read.updated (birebir): karşı tarafın okuduğu `peer_read_seq` yeniden okunur → "Okundu"', async () => {
    fakeClock()
    const { addMessage } = await import('./fake-chat')
    const direct = chatOf('dm2')
    const mine = addMessage(direct, WHO.admin, 'Rapor için teşekkürler')
    const app = await boot({ ...ADMIN, path: '/mesajlar/dm2' })
    await streamOpen()
    await until(() => texts().some((t) => t.includes('Rapor için teşekkürler')), 'mesaj')
    expect($('[data-seq="2"] .chat-tick')).not.toBeNull()
    expect($('[data-seq="2"] .chat-tick--read')).toBeNull()
    direct.reads[WHO.member.account_id] = mine.base.seq
    serverEmit('dm2', 'read.updated', { actor: WHO.member.account_id })
    await advance(1000)
    await until(() => $('[data-seq="2"] .chat-tick--read'), 'okundu tiki')
    await idle(app.queryClient)
  })

  it('member.changed: kendi hesabım çıkarıldı → getChat 404 → listeye dön', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    fakeClock()
    await streamOpen()
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    const group = chatOf(GROUP)
    group.members = group.members.filter((m) => m.account_id !== WHO.member.account_id)
    serverEmit(GROUP, 'member.changed', {
      actor: WHO.coord.account_id,
      affected: [WHO.member.account_id],
    })
    await advance(1000)
    await until(() => app.router.currentRoute.value.path === '/mesajlar', 'listeye döndü')
    await idle(app.queryClient)
    expect($('[data-chat-id="' + GROUP + '"]')).toBeNull()
    expect(rowEls().length).toBe(2)
  })

  it('typing: "Cem yazıyor…" başlıkta; önbelleğe yazılmaz; 5 sn sonra söner', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    await streamOpen()
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    const reads = sent('GET', `/v1/chats/${GROUP}/messages`).length
    serverEmit(GROUP, 'typing', { actor: WHO.second.account_id })
    await until(() => sub().includes('Cem yazıyor'), 'yazıyor')
    expect(
      JSON.stringify(
        app.queryClient
          .getQueryCache()
          .getAll()
          .map((q) => q.state.data),
      ),
    ).not.toContain('typing')
    await advance(5_200)
    await until(() => !sub().includes('yazıyor'), 'söndü')
    expect(sent('GET', `/v1/chats/${GROUP}/messages`)).toHaveLength(reads)
  })
})

describe('kopma ve uzlaştırma', () => {
  it('kopunca üstel bekleme + yeniden bağlanma; kaçan olaylar `reconcile` ile görünür (Last-Event-ID yok)', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    fakeClock()
    await streamOpen()
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    const lists = sent('GET', '/v1/chats').length
    dropStreams(chat.state)
    // Kopukken gelen mesaj + silme: olay kaçar.
    peerSays(GROUP, 'second', 'Kopukken yazılan')
    chat.state.chats.find((c) => c.chat_id === GROUP)!.messages.splice(-2, 1)
    await advance(1_100)
    await until(() => streamRequests().length === 2, 'yeniden bağlandı')
    await streamOpen()
    expect(streamCalls[1]!.lastEventId).toBeNull()
    await until(() => texts().some((t) => t.includes('Kopukken yazılan')), 'uzlaştırıldı')
    await idle(app.queryClient)
    expect(sent('GET', '/v1/chats').length).toBeGreaterThan(lists)
    expect(texts().some((t) => t.includes('Mekanik mesaj 60'))).toBe(false)
  })

  it('akış reddedilirse (403) yeniden deneme yok; 5xx → üstel bekleme ile tekrar', async () => {
    fakeClock()
    chat.state.streamReject = 503
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    fakeClock()
    await until(() => streamRequests().length >= 1, 'ilk deneme')
    await advance(1_100)
    await until(() => streamRequests().length >= 2, 'ikinci deneme (1 sn)')
    await advance(2_100)
    await until(() => streamRequests().length >= 3, 'üçüncü deneme (2 sn)')
    chat.state.streamReject = 403
    await advance(4_100)
    await until(() => streamRequests().length >= 4, 'dördüncü deneme (4 sn)')
    await advance(70_000)
    expect(streamRequests()).toHaveLength(4)
    await idle(app.queryClient)
  })
})

void userClick
