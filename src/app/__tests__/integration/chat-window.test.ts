// W160 · O3 senaryo 1 (a): sohbet penceresi — liste → seç → mesajlar (seq penceresi, daha eski
// yükle, alıntıya git ≤ 3 sayfa, okunmamış çapası) ve okundu türevleri (liste rozeti, sekme sayacı,
// kenar menüsü rozeti; KESİN 29). Gerçek router/AppShell/oturum + durumlu sahte sunucu.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  $$,
  addPeerReply,
  advance,
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

  it('alıntıya git: yüklü olmayan hedef ≤ 3 `before` sayfasında bulunur ve vurgulanır', async () => {
    const group = chatOf(GROUP)
    addPeerReply(GROUP, 2, 'coord', 'Bunu ele alalım')
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await until(() => $('.chat-quote'), 'alıntı')
    await idle(app.queryClient)
    expect(seqsOnScreen()).not.toContain(2)
    await userClick(() => $('.chat-quote'))
    await until(() => seqsOnScreen().includes(2), 'hedef yüklendi')
    expect(
      sent('GET', `/v1/chats/${GROUP}/messages`).filter((r) => r.query.has('before')),
    ).toHaveLength(1)
    expect($('.msg-row--focus')?.dataset.seq).toBe('2')
    expect(group.messages).toHaveLength(61)
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

  it('yönetici: kendi gönderimi okunmamış sayılmaz; read-all dışı rozet yok', async () => {
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => rowEls().length === 2, 'liste')
    await idle(app.queryClient)
    expect(badge()).toBe('1')
    expect($(`[data-chat-id="dm2"] .chat-row__badge`)?.textContent?.trim()).toBe('1')
  })
})
