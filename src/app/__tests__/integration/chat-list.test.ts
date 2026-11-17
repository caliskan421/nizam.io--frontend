// W160 · O3 (W155 notları) + W183 (BE-081): sohbet listesi — sunucu sırası + imleç sayfalama (50),
// süzgeç sekmeleri SUNUCU süzgecidir (`kind`/`unread`, sayaç `total`; istemci süzgeci yok), arama sunucuda 300 ms
// gecikmeli (Enter atlar; sahte saat), `?filtre=` seçimle ve geri dönüşle korunur (390), `chat.changed`
// olayı başlığı/liste adını günceller.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  $$,
  ADMIN,
  advance,
  boot,
  chat,
  chatOf,
  fakeClock,
  GROUP,
  idle,
  MEMBER,
  messageEls,
  narrowViewport,
  resetChats,
  rowEls,
  sent,
  serverEmit,
  streamOpen,
  teardown,
  until,
  useChatBackend,
  userClick,
  watchStreams,
  WHO,
} from './chat-support'
import { addMessage, makeChat, member } from './fake-chat'

const backend = useChatBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetChats()
  await boot({ ...ADMIN, path: '/mesajlar' })
  await until(() => rowEls().length > 0, 'ısınma')
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

/** Yönetici üyesi 60 ek grup: `i` küçüldükçe daha yeni (sunucu sırası: son mesaja göre azalan). */
function manyGroups(count: number): void {
  for (let i = 1; i <= count; i += 1) {
    const group = makeChat(
      `ex${i}`,
      'group',
      [member(WHO.admin.account_id), member(WHO.member.account_id)],
      {
        name: `Ek grup ${String(i).padStart(2, '0')}`,
      },
    )
    addMessage(group, WHO.member, `ek ${i}`)
    // En yeni son mesaj: ex1; en eski: ex<count>.
    group.messages[0]!.base.created_at = new Date(
      Date.UTC(2026, 10, 14, 12, 0) - i * 60_000,
    ).toISOString()
    chat.state.chats.push(group)
  }
}
const names = () => rowEls().map((r) => r.querySelector('.chat-row__name')?.textContent)
const tab = (label: string) =>
  $$('.chat-tabs [role="tab"]').find((t) => t.textContent?.includes(label)) ?? null

describe('sayfalama ve süzgeç', () => {
  it('ilk sayfa 50 (limit), "Daha fazla yükle" imleçle sürer; sunucu sırası korunur', async () => {
    manyGroups(60)
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => rowEls().length === 50, 'ilk sayfa')
    expect(sent('GET', '/v1/chats')[0]!.query.get('limit')).toBe('50')
    expect(names().slice(0, 2)).toEqual(['Ek grup 01', 'Ek grup 02'])
    await userClick(() => $$('.chat-list__more button')[0] ?? null)
    await until(() => rowEls().length === 62, 'ikinci sayfa')
    expect(sent('GET', '/v1/chats').at(-1)!.query.get('cursor')).toBe('50')
    expect($$('.chat-list__more button')).toHaveLength(0)
    await idle(app.queryClient)
  })

  it('Okunmamış sekmesi sunucu süzgecidir (BE-081): ikinci sayfadaki okunmamış da ilk sayfada gelir; sayaç `total`', async () => {
    manyGroups(60)
    // Sunucuda okunmamış YALNIZ ikinci sayfadaki bir grupta (ex58) + diğer okunmamışlar.
    for (let i = 1; i <= 60; i += 1) chatOf(`ex${i}`).reads[WHO.admin.account_id] = 99
    chatOf('ex58').reads[WHO.admin.account_id] = 0
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => rowEls().length === 50, 'ilk sayfa')
    await userClick(() => tab('Okunmamış'))
    await until(
      () => sent('GET', '/v1/chats').some((r) => r.query.get('unread') === 'true'),
      'sunucu süzgeci isteği',
    )
    const filtered = sent('GET', '/v1/chats').filter((r) => r.query.get('unread') === 'true')
    expect(filtered[0]!.query.get('cursor')).toBeNull()
    await until(() => rowEls().some((r) => r.dataset.chatId === 'ex58'), 'ex58 ilk sayfada')
    const total = Number(tab('Okunmamış')!.querySelector('.chat-tabs__n')!.textContent)
    expect(rowEls()).toHaveLength(total)
    expect(rowEls().length).toBeLessThan(50)
    expect($$('.chat-list__more button')).toHaveLength(0)
    // Eski yol yok: "yüklenen konuşmalar içinde" ipucu ve istemci süzgeci kalktı.
    expect($('.chat-list__hint')).toBeNull()
    expect(app.router.currentRoute.value.query.filtre).toBe('okunmamis')
    await idle(app.queryClient)
  })

  it('Gruplar / Kişiler sekmeleri sunucuda süzer (`kind`); seçim ve geri dönüş `?filtre=` korur (390 liste ↔ konuşma)', async () => {
    narrowViewport()
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => rowEls().length === 2, 'liste')
    await userClick(() => tab('Kişiler'))
    await until(() => rowEls().length === 1, 'yalnız birebir')
    expect(rowEls()[0]!.dataset.chatId).toBe('dm2')
    expect(sent('GET', '/v1/chats').at(-1)!.query.get('kind')).toBe('direct')
    await userClick(() => rowEls()[0] ?? null)
    await until(() => app.router.currentRoute.value.path === '/mesajlar/dm2', 'konuşma')
    expect(app.router.currentRoute.value.query.filtre).toBe('kisiler')
    await until(() => $('[data-testid="chat-back"]'), 'geri')
    await userClick('[data-testid="chat-back"]')
    await until(() => app.router.currentRoute.value.path === '/mesajlar', 'liste')
    expect(app.router.currentRoute.value.query.filtre).toBe('kisiler')
    await until(() => document.activeElement === $('[data-chat-id="dm2"]'), 'odak satırda')
    await userClick(() => tab('Gruplar'))
    await until(() => rowEls().length === 1 && rowEls()[0]!.dataset.chatId === GROUP, 'yalnız grup')
    await idle(app.queryClient)
  })
})

describe('liste satırı: Koordinatörler grubu, sessiz rozeti, okundu tiki (BE-160, BE-027, BE-082)', () => {
  it('Koordinatörler sistem grubu "K" avatarı + iğne ile gelir; sessiz grupta sayaç seviyeden bağımsız aynen görünür', async () => {
    const group = makeChat(
      'kg',
      'group',
      [member(WHO.admin.account_id, 'admin'), member(WHO.coord.account_id)],
      { name: 'Koordinatörler', auto_kind: 'coordinators', source: 'coordinators' },
    )
    addMessage(group, WHO.coord, 'Haftalık toplantı')
    addMessage(group, WHO.coord, 'Gündem eklendi')
    group.reads[WHO.admin.account_id] = 0
    group.notify_levels = { [WHO.admin.account_id]: 'none' }
    chat.state.chats.push(group)
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => $('[data-chat-id="kg"]'), 'Koordinatörler satırı')
    const row = $('[data-chat-id="kg"]')!
    expect(row.querySelector('.chat-av')?.textContent?.trim()).toBe('K')
    expect(row.querySelector('.chat-av--sys')).not.toBeNull()
    expect(row.querySelector('.chat-row__pin')).not.toBeNull()
    expect(row.querySelector('[data-testid="chat-row-muted"]')).not.toBeNull()
    expect(row.querySelector('.chat-row__badge')?.textContent?.trim()).toBe('2')
    expect($(`[data-chat-id="${GROUP}"] [data-testid="chat-row-muted"]`)).toBeNull()
    await idle(app.queryClient)
  })

  it('birebirde son mesajım: tik karşı tarafın `peer_read_seq` imlecinden (gönderildi → okundu)', async () => {
    const dm = chatOf('dm2')
    addMessage(dm, WHO.admin, 'Raporu aldım')
    dm.reads[WHO.member.account_id] = 1
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => $('[data-chat-id="dm2"] [data-testid="chat-row-tick"]'), 'tik')
    const tick = () => $('[data-chat-id="dm2"] [data-testid="chat-row-tick"]')
    expect(tick()?.getAttribute('aria-label')).toBe('Gönderildi')
    dm.reads[WHO.member.account_id] = 2
    await app.queryClient.invalidateQueries()
    await until(() => tick()?.getAttribute('aria-label') === 'Okundu', 'okundu tiki')
    await idle(app.queryClient)
  })
})

describe('arama', () => {
  it('terim sunucuya 300 ms gecikmeyle gider (`q`); Enter gecikmeyi atlar; temizlenince tam liste', async () => {
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => rowEls().length === 2, 'liste')
    fakeClock()
    const input = $(
      '[data-testid="chat-search"] input, input[data-testid="chat-search"]',
    ) as HTMLInputElement
    input.value = 'Mekanik'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await advance(250)
    expect(sent('GET', '/v1/chats').some((r) => r.query.get('q') === 'Mekanik')).toBe(false)
    await advance(100)
    await until(
      () => sent('GET', '/v1/chats').some((r) => r.query.get('q') === 'Mekanik'),
      'arama isteği',
    )
    await until(() => rowEls().length === 1, 'sonuç')
    expect(rowEls()[0]!.dataset.chatId).toBe(GROUP)
    input.value = 'Ayşe'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    )
    await until(
      () => sent('GET', '/v1/chats').some((r) => r.query.get('q') === 'Ayşe'),
      'Enter ile hemen',
    )
    await idle(app.queryClient)
  })
})

describe('chat.changed', () => {
  it('grup adı değişince başlık ve liste adı güncellenir (getChat + liste yeniden okunur)', async () => {
    fakeClock()
    const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
    await streamOpen()
    await until(() => messageEls().length > 0, 'mesajlar')
    await idle(app.queryClient)
    chatOf(GROUP).name = 'Mekanik Ekibi (yeni ad)'
    serverEmit(GROUP, 'chat.changed', { actor: WHO.coord.account_id })
    await advance(1000)
    await until(
      () => $('.chat-thread__title strong')?.textContent === 'Mekanik Ekibi (yeni ad)',
      'başlık',
    )
    await until(() => names().includes('Mekanik Ekibi (yeni ad)'), 'liste adı')
    await idle(app.queryClient)
  })
})
