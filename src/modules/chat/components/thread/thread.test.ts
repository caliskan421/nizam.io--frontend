import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { msg } from '../../__tests__/fixtures'
import { resetAll, server, signIn } from '../../__tests__/harness'
import { mountPane, servePane } from '../__tests__/pane-harness'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetAll()
  document.body.innerHTML = ''
})
afterAll(() => server.close())
beforeEach(signIn)

const day = (d: number, h = 9, m = 0) => new Date(2026, 10, d, h, m).toISOString()

describe('konuşma akışı (görünüm)', () => {
  it('balonlar, gün ayırıcı, ardışık gruplama ve gönderen adı yalnız grubun ilkinde', async () => {
    servePane({
      messages: [
        msg(1, { created_at: day(10, 9, 0), sender_name: 'Ayşe Yılmaz', body: 'Merhaba' }),
        msg(2, { created_at: day(10, 9, 2), sender_name: 'Ayşe Yılmaz', body: 'Toplantı var' }),
        msg(3, {
          created_at: day(11, 9, 0),
          sender_account_id: 'acc-1',
          body: 'Tamam',
          sender_name: undefined,
        }),
      ],
    })
    const { wrapper } = await mountPane()
    const rows = wrapper.findAll('[data-testid="chat-message"]')
    expect(rows).toHaveLength(3)
    expect(wrapper.findAll('.chat-sep')).toHaveLength(2)
    expect(rows[0]!.find('.chat-bub__name').text()).toBe('Ayşe Yılmaz')
    expect(rows[1]!.find('.chat-bub__name').exists()).toBe(false)
    expect(rows[2]!.classes()).toContain('msg-row--me')
    expect(rows[2]!.find('.chat-bub__name').exists()).toBe(false)
  })

  it('boş sohbet: "Henüz mesaj yok"', async () => {
    servePane({ messages: [] })
    const { wrapper } = await mountPane()
    expect(wrapper.get('[data-testid="chat-empty"]').text()).toContain('Henüz mesaj yok')
  })

  it('alıntı (silinmiş), düzenlendi etiketi, tepki çipleri ve dört tepki seçici', async () => {
    servePane({
      messages: [
        msg(1, {
          body: 'Yanıt',
          edited: true,
          edited_at: day(10, 9, 5),
          reactions: [{ kind: 'like', count: 2, mine: true }],
          reply_to_message_id: 'm0',
          reply_to: {
            message_id: 'm0',
            body: null,
            deleted: true,
            sender_account_id: 'u3',
            sender_name: 'Reha',
          },
        }),
      ],
    })
    const { wrapper } = await mountPane()
    expect(wrapper.get('.chat-quote').text()).toContain('Reha')
    expect(wrapper.get('.chat-quote').text()).toContain('silinmiş mesaj')
    expect(wrapper.get('.chat-bub__meta').text()).toContain('düzenlendi · 09:05')
    const react = wrapper.get('.chat-react')
    expect(react.attributes('aria-pressed')).toBe('true')
    await wrapper.get('[aria-label="Tepki ver"]').trigger('click')
    expect(wrapper.findAll('.chat-pop__emoji')).toHaveLength(4)
  })

  it('birebirde okundu tiki (peer_read_seq); grupta tik yok', async () => {
    servePane({
      chat: { kind: 'direct', name: null, counterpart_name: 'Ayşe Yılmaz' },
      peerReadSeq: 1,
      messages: [msg(1, { sender_account_id: 'acc-1' }), msg(2, { sender_account_id: 'acc-1' })],
    })
    const { wrapper } = await mountPane()
    const ticks = wrapper.findAll('.chat-tick')
    expect(ticks.map((t) => t.attributes('aria-label'))).toEqual(['Okundu', 'Gönderildi'])
  })

  it('grupta giden mesajda okundu tiki çizilmez (BE-028)', async () => {
    servePane({ messages: [msg(1, { sender_account_id: 'acc-1' })] })
    const { wrapper } = await mountPane()
    expect(wrapper.find('.chat-tick').exists()).toBe(false)
  })
})
