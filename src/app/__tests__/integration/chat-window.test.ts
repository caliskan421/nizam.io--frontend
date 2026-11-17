// W160 · O3 senaryo 1 (a): sohbet penceresi — liste → seç → mesajlar (seq penceresi, daha eski
// yükle, alıntıya `around=<reply_to.seq>` ile git (BE-162), okunmamış çapası `first_unread_seq`, BE-082) ve okundu türevleri (liste rozeti, sekme sayacı,
// kenar menüsü rozeti; KESİN 29). Gerçek router/AppShell/oturum + durumlu sahte sunucu.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { addMessage } from './fake-chat'
import {
  $,
  $$,
  addPeerReply,
  advance,
  toasts,
  boot,
  chatOf,
  GROUP,
  MEMBER,
  ADMIN,
  fakeClock,
  idle,
  messageEls,
  resetChats,
  rowEls,
  sent,
  teardown,
  until,
  useChatBackend,
  watchStreams,
  userClick,
  WHO,
} from './chat-support'

const backend = useChatBackend({ coordinator: 'koordinator', member: 'uye' })
const seqsOnScreen = () => messageEls().map((el) => Number(el.dataset.seq))
const badge = () => $('nav .side-badge[data-badge="unread"]')?.textContent?.trim() ?? null

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetChats()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
  await until(() => messageEls().length > 0, 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  resetChats()
  watchStreams()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
})
afterEach(() => {
  vi.useRealTimers()
  teardown()
})
afterAll(() => backend.server.close())

describe('liste → konuşma → pencere', () => {
  it('üye: liste sunucu sırasıyla; satır → son 50 mesaj (11–60), daha eski yükle → 1–10', async () => {
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => rowEls().length === 3, 'liste')
    await userClick(() => $(`[data-chat-id="${GROUP}"]`))
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    expect(app.router.currentRoute.value.path).toBe(`/mesajlar/${GROUP}`)
    expect(Math.min(...seqsOnScreen())).toBe(11)
    expect(Math.max(...seqsOnScreen())).toBe(60)
    expect(sent('GET', `/v1/chats/${GROUP}/messages`)[0]!.query.get('limit')).toBe('50')
    const older = await until(() => $$('.msg-list__more')[0], 'daha eski düğmesi')
    await userClick(() => older)
    await until(() => seqsOnScreen().includes(1), 'eski sayfa')
    expect(sent('GET', `/v1/chats/${GROUP}/messages`).at(-1)!.query.get('before')).toBe('11')
    expect(seqsOnScreen()).toHaveLength(60)
    expect($$('.msg-list__more')).toHaveLength(0)
  })

  it('alıntıya git: yüklü olmayan hedef `around=<reply_to.seq>` ile tek okumada yüklenir ve vurgulanır', async () => {
    const group = chatOf(GROUP)
    addPeerReply(GROUP, 2, 'coord', 'Bunu ele alalım')
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => $('.chat-quote'), 'alıntı')
    await idle(app.queryClient)
    expect(seqsOnScreen()).not.toContain(2)
    await userClick(() => $('.chat-quote'))
    await until(() => seqsOnScreen().includes(2), 'hedef yüklendi')
    const reads = sent('GET', `/v1/chats/${GROUP}/messages`)
    expect(reads.filter((r) => r.query.get('around') === '2')).toHaveLength(1)
    expect(reads.filter((r) => r.query.has('before'))).toHaveLength(0)
    expect($('.msg-row--focus')?.dataset.seq).toBe('2')
    expect(group.messages).toHaveLength(61)
  })
})

describe('okunmamış açılışı (BE-082)', () => {
  it('ilk okunmamış son sayfanın dışındaysa pencere `around=first_unread_seq` ile kurulur; ayırıcı o mesajın üstünde', async () => {
    chatOf(GROUP).reads[WHO.member.account_id] = 5
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => $('[data-testid="chat-unread"]'), 'okunmamış ayırıcı')
    await idle(app.queryClient)
    const reads = sent('GET', `/v1/chats/${GROUP}/messages`)
    expect(reads.filter((r) => r.query.get('around') === '6')).toHaveLength(1)
    expect(reads.filter((r) => r.query.has('before'))).toHaveLength(0)
    expect(seqsOnScreen()).toContain(6)
    const divider = $('[data-testid="chat-unread"]')!
    const first = $('[data-seq="6"]')!
    expect(divider.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(divider.textContent).toContain('55')
  })

  it('hepsi okunmuş: sunucu `first_unread_seq` null → ayırıcı yok, `around` okuması yok', async () => {
    const group = chatOf(GROUP)
    group.reads[WHO.member.account_id] = group.last_seq
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    expect($('[data-testid="chat-unread"]')).toBeNull()
    expect(sent('GET', `/v1/chats/${GROUP}/messages`).some((r) => r.query.has('around'))).toBe(
      false,
    )
  })
})

describe('derin bağlantı ve uzak alıntı', () => {
  it('`?mesaj=<seq>`: hedefin çevresi `around` ile yüklenir ve vurgulanır; son sayfa okunmaz', async () => {
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}?mesaj=5` })
    await until(() => seqsOnScreen().includes(5), 'hedef yüklendi')
    await idle(app.queryClient)
    const around = sent('GET', `/v1/chats/${GROUP}/messages`).filter(
      (r) => r.query.get('around') === '5',
    )
    expect(around).toHaveLength(1)
    expect($('.msg-row--focus')?.dataset.seq).toBe('5')
    expect(Math.min(...seqsOnScreen())).toBeLessThanOrEqual(5)
  })

  it('çok uzak alıntı (330 mesaj geride): yine tek `around` okuması, `before` zinciri yok', async () => {
    const group = chatOf(GROUP)
    for (let i = 61; i <= 330; i += 1) addMessage(group, WHO.coord, `Mekanik mesaj ${i}`)
    addPeerReply(GROUP, 1, 'second', 'Çok eski bir mesaja yanıt')
    group.reads[WHO.member.account_id] = group.last_seq
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => $('.chat-quote'), 'alıntı')
    await idle(app.queryClient)
    await userClick(() => $('.chat-quote'))
    await until(() => seqsOnScreen().includes(1), 'hedef yüklendi')
    await idle(app.queryClient)
    const reads = sent('GET', `/v1/chats/${GROUP}/messages`)
    expect(reads.filter((r) => r.query.get('around') === '1')).toHaveLength(1)
    expect(reads.filter((r) => r.query.has('before'))).toHaveLength(0)
    expect($('.msg-row--focus')?.dataset.seq).toBe('1')
    expect(toasts()).toBe('')
  })
})

describe('okundu türevleri (KESİN 29)', () => {
  it('açılışta okunmamış ayırıcı 20; 1 sn sonra TEK markChatRead → liste rozeti ve menü rozeti düşer', async () => {
    fakeClock()
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => rowEls().length === 3, 'liste')
    await until(() => badge() === '2', 'menü rozeti 2 sohbet (grup + Cem birebiri)')
    await userClick(() => $(`[data-chat-id="${GROUP}"]`))
    await until(() => $('[data-testid="chat-unread"]'), 'okunmamış ayırıcı')
    expect($('[data-testid="chat-unread"]')!.textContent).toContain('20')
    expect(sent('POST', `/v1/chats/${GROUP}/read`)).toHaveLength(0)
    $('.msg-list')!.dispatchEvent(new Event('scroll'))
    $('.msg-list')!.dispatchEvent(new Event('scroll'))
    await advance(1000)
    await idle(app.queryClient)
    expect(sent('POST', `/v1/chats/${GROUP}/read`)).toHaveLength(1)
    expect(chatOf(GROUP).reads[WHO.member.account_id]).toBe(60)
    await until(() => badge() === '1', 'menü rozeti 1 sohbete düştü')
    expect($(`[data-chat-id="${GROUP}"] .chat-row__badge`)).toBeNull()
    expect($(`[data-chat-id="dm1"] .chat-row__badge`)?.textContent?.trim()).toBe('1')
  })

  it('odaksızken zamanlayıcı vazgeçer (POST yok); odak dönüşü → 1 sn sonra TEK markChatRead, rozet düşer (CX-F7-Ö-03)', async () => {
    fakeClock()
    const focus = vi.spyOn(document, 'hasFocus').mockReturnValue(false)
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => rowEls().length === 3, 'liste')
    await until(() => badge() === '2', 'menü rozeti 2')
    await userClick(() => $(`[data-chat-id="${GROUP}"]`))
    await until(() => $('[data-testid="chat-unread"]'), 'okunmamış ayırıcı')
    $('.msg-list')!.dispatchEvent(new Event('scroll'))
    await advance(3000)
    await idle(app.queryClient)
    expect(sent('POST', `/v1/chats/${GROUP}/read`)).toHaveLength(0)
    expect(badge()).toBe('2')
    focus.mockReturnValue(true)
    globalThis.dispatchEvent(new Event('focus'))
    globalThis.dispatchEvent(new Event('focus'))
    await advance(999)
    expect(sent('POST', `/v1/chats/${GROUP}/read`)).toHaveLength(0)
    await advance(1)
    await idle(app.queryClient)
    expect(sent('POST', `/v1/chats/${GROUP}/read`)).toHaveLength(1)
    await until(() => badge() === '1', 'menü rozeti 1 sohbete düştü')
  })

  it('yönetici: kendi gönderimi okunmamış sayılmaz; read-all dışı rozet yok', async () => {
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => rowEls().length === 2, 'liste')
    await idle(app.queryClient)
    expect(badge()).toBe('1')
    expect($(`[data-chat-id="dm2"] .chat-row__badge`)?.textContent?.trim()).toBe('1')
  })
})
