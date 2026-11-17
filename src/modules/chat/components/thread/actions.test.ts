import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { msg } from '../../__tests__/fixtures'
import {
  http,
  json,
  noContent,
  ORIGIN,
  resetAll,
  sent,
  server,
  signIn,
} from '../../__tests__/harness'
import { mountPane, servePane, settle, unmountAll } from '../__tests__/pane-harness'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetAll()
  unmountAll()
})
afterAll(() => server.close())
beforeEach(signIn)

const mine = (seq: number, over = {}) =>
  msg(seq, { sender_account_id: 'acc-1', sender_name: undefined, ...over })

async function openMenu(wrapper: Awaited<ReturnType<typeof mountPane>>['wrapper'], i = 0) {
  await wrapper.findAll('[aria-label="Diğer"]')[i]!.trigger('click')
  return wrapper.get('[role="menu"][aria-label="Mesaj menüsü"]')
}
const items = (menu: { findAll: (s: string) => { text: () => string }[] }) =>
  menu.findAll('[role^="menuitem"]').map((el) => el.text())

describe('mesaj eylemleri', () => {
  it('tepki: koy (PUT) → around okuması; aynı türe tık kaldırır (DELETE); iyimser değişiklik yok', async () => {
    const { fake } = servePane({
      messages: [msg(1, { reactions: [{ kind: 'like', count: 1, mine: true }] })],
    })
    server.use(
      http.put(`${ORIGIN}/v1/chats/c1/messages/m1/reaction`, () => noContent()),
      http.delete(`${ORIGIN}/v1/chats/c1/messages/m1/reaction`, () => noContent()),
    )
    const { wrapper, client } = await mountPane()
    const before = fake.reads.length
    await wrapper.get('[aria-label="Tepki ver"]').trigger('click')
    await wrapper.findAll('.chat-pop__emoji')[1]!.trigger('click')
    await settle(client)
    expect(sent('PUT', '/v1/chats/c1/messages/m1/reaction')).toHaveLength(1)
    expect(fake.reads.length).toBeGreaterThan(before)
    await wrapper.get('.chat-react').trigger('click')
    await settle(client)
    expect(sent('DELETE', '/v1/chats/c1/messages/m1/reaction')).toHaveLength(1)
  })

  it('menü: üyenin kendi mesajında Düzenle/Sil/Bilgi; başkasında yok; İlet devre dışı + stub', async () => {
    servePane({ messages: [msg(1), mine(2)] })
    const { wrapper } = await mountPane()
    const other = items(await openMenu(wrapper, 0))
    expect(other).toEqual(expect.arrayContaining(['Yanıtla', 'İlet Yakında', 'Bağlantıyı kopyala']))
    expect(other.join()).not.toMatch(/Sil|Düzenle|Mesaj bilgisi|Sabitle|Göreve/)
    expect(wrapper.get('[data-design-stub="BE-080"] button').attributes('disabled')).toBeDefined()
    await wrapper.get('.msg-row [aria-label="Diğer"]').trigger('click')
    const own = items(await openMenu(wrapper, 1))
    expect(own).toEqual(expect.arrayContaining(['Düzenle', 'Sil', 'Mesaj bilgisi Yakında']))
    expect(wrapper.find('[data-design-stub="BE-028"] button').attributes('disabled')).toBeDefined()
  })

  it('yönetici (ŞY) grupta sabitler ve göreve dönüştürür; birebirde iki taraf sabitler', async () => {
    servePane({ companyAdmin: true, chat: { role: 'admin' }, messages: [msg(1)] })
    server.use(http.put(`${ORIGIN}/v1/chats/c1/messages/m1/pin`, () => noContent()))
    const { wrapper, client, dialogs } = await mountPane()
    const menu = await openMenu(wrapper)
    expect(items(menu)).toEqual(expect.arrayContaining(['Sabitle', 'Göreve dönüştür']))
    await menu
      .findAll('[role="menuitem"]')
      .find((e) => e.text() === 'Göreve dönüştür')!
      .trigger('click')
    expect(dialogs).toEqual([{ dialog: 'taskFromMessage', chatId: 'c1', messageId: 'm1', seq: 1 }])
    const again = await openMenu(wrapper)
    await again
      .findAll('[role="menuitem"]')
      .find((e) => e.text() === 'Sabitle')!
      .trigger('click')
    await settle(client)
    expect(sent('PUT', '/v1/chats/c1/messages/m1/pin')).toHaveLength(1)
  })

  it('sil: ortak onay → DELETE → satır kalkar; odak gövdeye düşmez', async () => {
    const { fake } = servePane({ messages: [mine(1), msg(2)] })
    server.use(
      http.delete(`${ORIGIN}/v1/chats/c1/messages/m1`, () => {
        fake.remove(1)
        return noContent()
      }),
    )
    const { wrapper, client } = await mountPane()
    const menu = await openMenu(wrapper, 0)
    await menu
      .findAll('[role="menuitem"]')
      .find((e) => e.text() === 'Sil')!
      .trigger('click')
    await flushPromises()
    expect(sent('DELETE', '/v1/chats/c1/messages/m1')).toHaveLength(0)
    const confirm = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Sil',
    )!
    confirm.click()
    await settle(client)
    expect(sent('DELETE', '/v1/chats/c1/messages/m1')).toHaveLength(1)
    expect(wrapper.findAll('[data-testid="chat-message"]')).toHaveLength(1)
    expect(document.activeElement).not.toBe(document.body)
  })

  it('menü Esc ile kapanır ve odak tetikleyiciye (Diğer) döner; tepki seçici de', async () => {
    servePane({ messages: [msg(1)] })
    const { wrapper } = await mountPane()
    const trigger = wrapper.get('[aria-label="Diğer"]')
    await trigger.trigger('click')
    await wrapper.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
    const react = wrapper.get('[aria-label="Tepki ver"]')
    await react.trigger('click')
    await wrapper.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(document.activeElement).toBe(react.element)
  })

  it('anket: oy ver (PUT), kapanmışta seçenekler devre dışı; paylaşılan dosya "artık yok"', async () => {
    servePane({
      messages: [
        msg(1, {
          body: 'Gün seçelim',
          poll: {
            anonymous: false,
            multi: false,
            closes_at: null,
            closed_at: null,
            results: [
              {
                option_index: 0,
                label: 'Cuma',
                count: 1,
                mine: false,
                voters: [{ account_id: 'u9', full_name: 'X' }],
              },
              { option_index: 1, label: 'Cumartesi', count: 0, mine: false, voters: [] },
            ],
          },
        }),
        msg(2, {
          body: 'Kapalı',
          poll: {
            anonymous: false,
            multi: false,
            closes_at: null,
            closed_at: '2026-11-13T00:00:00Z',
            results: [{ option_index: 0, label: 'Evet', count: 0, mine: false, voters: [] }],
          },
        }),
        msg(3, { body: 'Dosya', refs: [{ kind: 'file', ref_id: 'rf1', target_id: 'f1' }] }),
      ],
    })
    server.use(
      http.put(`${ORIGIN}/v1/chats/c1/messages/m1/vote`, () => noContent()),
      http.get(`${ORIGIN}/v1/chat-refs/rf1`, () =>
        json({
          available: false,
          chat_id: 'c1',
          kind: 'file',
          message_id: 'm3',
          ref_id: 'rf1',
          target_id: 'f1',
        }),
      ),
    )
    const { wrapper, client } = await mountPane()
    const polls = wrapper.findAll('.chat-poll')
    expect(polls[0]!.text()).toContain('1 kişi oy verdi')
    expect(polls[0]!.text()).toContain('%100')
    await polls[0]!.findAll('.chat-poll__opt')[1]!.trigger('click')
    await settle(client)
    expect(sent('PUT', '/v1/chats/c1/messages/m1/vote')).toHaveLength(1)
    expect(polls[1]!.text()).toContain('Anket kapandı')
    expect(polls[1]!.get('.chat-poll__opt').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="chat-file-gone"]').text()).toContain('Bu öğe artık yok')
  })
})

describe('anket sorusu tek kez (KUSUR 5)', () => {
  it('anket mesajında soru yalnız kart başlığında görünür; balon metni çizilmez', async () => {
    servePane({
      messages: [
        msg(1, {
          body: 'Hangi gün uygun?',
          poll: {
            anonymous: false,
            multi: false,
            closes_at: null,
            closed_at: null,
            results: [{ option_index: 0, label: 'Cuma', count: 0, mine: false, voters: [] }],
          },
        }),
        msg(2, { body: 'Düz mesaj' }),
      ],
    })
    const { wrapper } = await mountPane()
    const rows = wrapper.findAll('[data-testid="chat-message"]')
    expect(rows[0]!.text().split('Hangi gün uygun?').length - 1).toBe(1)
    expect(rows[0]!.find('.chat-bub__text').exists()).toBe(false)
    expect(rows[0]!.get('.chat-poll__q').text()).toContain('Hangi gün uygun?')
    expect(rows[1]!.get('.chat-bub__text').text()).toBe('Düz mesaj')
  })
})

describe('açılır yüzeyin görünürlüğü (KUSUR 9)', () => {
  it('menü ve tepki seçici açılınca kaydırma kabında görünür olana dek kaydırılır (block: nearest)', async () => {
    servePane({ messages: [msg(1)] })
    const scroll = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scroll,
    })
    try {
      const { wrapper } = await mountPane()
      await openMenu(wrapper, 0)
      await flushPromises()
      expect(scroll).toHaveBeenCalledWith({ block: 'nearest' })
      expect(scroll.mock.instances.at(-1)).toBe(wrapper.get('.chat-pop--more').element)
      scroll.mockClear()
      await wrapper.get('[aria-label="Tepki ver"]').trigger('click')
      await flushPromises()
      expect(scroll).toHaveBeenCalledWith({ block: 'nearest' })
    } finally {
      delete (Element.prototype as unknown as Record<string, unknown>).scrollIntoView
    }
  })
})
