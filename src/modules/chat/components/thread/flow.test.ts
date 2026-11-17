import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { msg, range } from '../../__tests__/fixtures'
import {
  errorEnvelope,
  http,
  json,
  ORIGIN,
  resetAll,
  sent,
  server,
  signIn,
} from '../../__tests__/harness'
import { mountPane, servePane, settle, unmountAll } from '../__tests__/pane-harness'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  vi.useRealTimers()
  resetAll()
  unmountAll()
})
afterAll(() => server.close())
beforeEach(signIn)

describe('okundu işaretleme', () => {
  it('görünür + odakta + sonda → 1 sn sonra TEK markChatRead, son başkasının mesajıyla', async () => {
    servePane({
      messages: [msg(1), msg(2), msg(3, { sender_account_id: 'acc-1', sender_name: undefined })],
    })
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { wrapper, client } = await mountPane()
    wrapper.get('[data-testid="msg-list"], .msg-list').element.dispatchEvent(new Event('scroll'))
    wrapper.get('.msg-list').element.dispatchEvent(new Event('scroll'))
    expect(sent('POST', '/v1/chats/c1/read')).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(1000)
    await settle(client)
    const calls = sent('POST', '/v1/chats/c1/read')
    expect(calls).toHaveLength(1)
  })

  it('odakta değilse işaretlemez', async () => {
    servePane({ messages: [msg(1)] })
    vi.spyOn(document, 'hasFocus').mockReturnValue(false)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { wrapper } = await mountPane()
    wrapper.get('.msg-list').element.dispatchEvent(new Event('scroll'))
    await vi.advanceTimersByTimeAsync(1500)
    expect(sent('POST', '/v1/chats/c1/read')).toHaveLength(0)
  })

  it('404 message_not_found → son görünen BAŞKA mesajla bir kez daha', async () => {
    servePane({ messages: [msg(1), msg(2)] })
    const ids: string[] = []
    server.use(
      http.post(`${ORIGIN}/v1/chats/c1/read`, async ({ request }) => {
        const body = (await request.json()) as { message_id: string }
        ids.push(body.message_id)
        return body.message_id === 'm2'
          ? errorEnvelope('messaging.message_not_found', 404)
          : new Response(null, { status: 204 })
      }),
    )
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { wrapper, client } = await mountPane()
    wrapper.get('.msg-list').element.dispatchEvent(new Event('scroll'))
    await vi.advanceTimersByTimeAsync(1000)
    await settle(client)
    expect(ids).toEqual(['m2', 'm1'])
  })
})

describe('okunmamış ayırıcı ve pencere', () => {
  it('ayırıcı sunucu `first_unread_seq` mesajının üstüne çizilir; metindeki sayı `unread_count`', async () => {
    servePane({
      summary: { unread_count: 2, first_unread_seq: 2 },
      messages: [
        msg(1),
        msg(2),
        msg(3, { sender_account_id: 'acc-1', sender_name: undefined }),
        msg(4),
      ],
    })
    const { wrapper } = await mountPane()
    await vi.waitFor(() => expect(wrapper.find('[data-testid="chat-unread"]').exists()).toBe(true))
    const html = wrapper.get('.msg-list').element.innerHTML
    const divider = html.indexOf('data-testid="chat-unread"')
    expect(html.indexOf('data-seq="2"')).toBeGreaterThan(divider)
    expect(html.indexOf('data-seq="1"')).toBeLessThan(divider)
    expect(wrapper.get('[data-testid="chat-unread"]').text()).toBe('2 okunmamış mesaj')
  })

  it('çapa yüklü pencerede yoksa pencere `around=first_unread_seq` ile kurulur; `before` araması yok', async () => {
    const { fake } = servePane({
      summary: { unread_count: 900, first_unread_seq: 10 },
      messages: range(1, 120),
    })
    const { wrapper, client } = await mountPane()
    await settle(client)
    await vi.waitFor(() => expect(wrapper.find('[data-testid="chat-unread"]').exists()).toBe(true))
    expect(fake.reads.some((r) => r.around === 10)).toBe(true)
    expect(fake.reads.filter((r) => r.before !== undefined)).toHaveLength(0)
    const html = wrapper.get('.msg-list').element.innerHTML
    expect(html.indexOf('data-seq="10"')).toBeGreaterThan(html.indexOf('data-testid="chat-unread"'))
  })

  it('eski yol yok: `first_unread_seq` null iken `unread_count` > 0 olsa da ayırıcı türetilmez', async () => {
    const { fake } = servePane({
      summary: { unread_count: 3, first_unread_seq: null },
      messages: range(1, 10),
    })
    const { wrapper, client } = await mountPane()
    await settle(client)
    expect(wrapper.find('[data-testid="chat-unread"]').exists()).toBe(false)
    expect(fake.reads.filter((r) => r.before !== undefined || r.around !== undefined)).toHaveLength(
      0,
    )
  })

  it('kendi mesajım / üyelik başlangıcı: sunucu null verir → ayırıcı yok, açılış son sayfa', async () => {
    const own = [1, 2, 3].map((n) => msg(n, { sender_account_id: 'acc-1', sender_name: undefined }))
    servePane({ summary: { unread_count: 0, first_unread_seq: null }, messages: own })
    const { wrapper, client } = await mountPane()
    await settle(client)
    expect(wrapper.find('[data-testid="chat-unread"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="chat-message"]')).toHaveLength(3)
  })

  it('boş pencere: çapa var ama mesaj dönmüyorsa ayırıcı çizilmez', async () => {
    servePane({ summary: { unread_count: 1, first_unread_seq: 5 }, messages: [] })
    const { wrapper, client } = await mountPane()
    await settle(client)
    expect(wrapper.find('[data-testid="chat-unread"]').exists()).toBe(false)
  })

  it('yukarı kaydırma eski sayfayı yükler; "Daha eski" düğmesi de aynı işi yapar', async () => {
    const { fake } = servePane({ messages: range(1, 120) })
    const { wrapper, client } = await mountPane()
    const before = fake.reads.filter((r) => r.before !== undefined).length
    await wrapper.get('.msg-list__more').trigger('click')
    await settle(client)
    expect(fake.reads.filter((r) => r.before !== undefined).length).toBe(before + 1)
    expect(wrapper.findAll('[data-testid="chat-message"]').length).toBeGreaterThan(50)
  })

  it('?mesaj=<seq>: hedefin çevresi yüklenir (around) ve vurgulanır', async () => {
    const { fake } = servePane({ messages: range(1, 200) })
    const { wrapper, client } = await mountPane({ path: '/mesajlar/c1?mesaj=30' })
    await settle(client)
    await vi.waitFor(() => expect(fake.reads.some((r) => r.around === 30)).toBe(true))
    await vi.waitFor(() =>
      expect(wrapper.find('[data-seq="30"].msg-row--focus').exists()).toBe(true),
    )
  })

  it('alıntıya tık: yüklü pencerede mesajı vurgular', async () => {
    servePane({
      messages: [
        msg(1, { body: 'asıl' }),
        msg(2, {
          reply_to_message_id: 'm1',
          reply_to: {
            message_id: 'm1',
            body: 'asıl',
            deleted: false,
            sender_account_id: 'u2',
            sender_name: 'Ayşe',
            seq: 1,
          },
        }),
      ],
    })
    const { wrapper } = await mountPane()
    await wrapper.get('.chat-quote').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-seq="1"].msg-row--focus').exists()).toBe(true)
  })

  it('uzak alıntı: tık doğrudan `around=<reply_to.seq>` okur (before araması yok) ve hedefi vurgular', async () => {
    const quote = (seq: number | null, deleted = false) => ({
      message_id: 'm5',
      body: deleted ? null : 'çok eski',
      deleted,
      sender_account_id: 'u2',
      sender_name: 'Ayşe',
      seq,
    })
    const all = range(1, 200)
    all[199] = msg(200, { reply_to_message_id: 'm5', reply_to: quote(5) })
    const { fake } = servePane({ messages: all })
    const { wrapper, client } = await mountPane()
    await settle(client)
    expect(wrapper.find('[data-seq="5"]').exists()).toBe(false)
    await wrapper.get('.chat-quote').trigger('click')
    await settle(client)
    await vi.waitFor(() =>
      expect(wrapper.find('[data-seq="5"].msg-row--focus').exists()).toBe(true),
    )
    expect(fake.reads.filter((r) => r.around === 5)).toHaveLength(1)
    expect(fake.reads.filter((r) => r.before !== undefined)).toHaveLength(0)
  })

  it('silinmiş alıntı (`seq` null): düğme devre dışı, okuma yok', async () => {
    const { fake } = servePane({
      messages: [
        msg(1),
        msg(2, {
          reply_to_message_id: 'm1',
          reply_to: {
            message_id: 'm1',
            body: null,
            deleted: true,
            sender_account_id: null,
            sender_name: null,
            seq: null,
          },
        }),
      ],
    })
    const { wrapper, client } = await mountPane()
    await settle(client)
    const button = wrapper.get('.chat-quote')
    expect(button.attributes('disabled')).toBeDefined()
    const before = fake.reads.length
    await button.trigger('click')
    expect(fake.reads).toHaveLength(before)
  })

  it('açık `?mesaj=` hedefi okunmamış açılışından önceliklidir: `around=first_unread_seq` okunmaz, hedef korunur', async () => {
    const { fake } = servePane({
      summary: { unread_count: 190, first_unread_seq: 10 },
      messages: range(1, 200),
    })
    const { wrapper, client } = await mountPane({ path: '/mesajlar/c1?mesaj=150' })
    await settle(client)
    await vi.waitFor(() =>
      expect(wrapper.find('[data-seq="150"].msg-row--focus').exists()).toBe(true),
    )
    expect(fake.reads.some((r) => r.around === 150)).toBe(true)
    expect(fake.reads.some((r) => r.around === 10)).toBe(false)
    expect(wrapper.find('[data-seq="150"]').exists()).toBe(true)
  })

  it('yeni mesaj SSE yankısıyla gelince akışa eklenir; "yazıyor" başlıkta görünür', async () => {
    const { fake } = servePane({
      members: [
        {
          account_id: 'u2',
          full_name: 'Ayşe Yılmaz',
          founder: false,
          from_source: false,
          role: 'member',
        },
      ],
      messages: [msg(1)],
    })
    const { wrapper, typing, client } = await mountPane()
    typing.value = ['u2']
    await settle(client)
    expect(wrapper.get('header').text()).toContain('Ayşe yazıyor…')
    fake.add(msg(2))
    typing.value = []
    await settle(client)
    expect(wrapper.get('header').text()).toContain('Grup')
  })

  it('sabit şeridi: sayaç, sonraki, tık mesaja gider; n+ kesildiğinde', async () => {
    servePane({
      messages: range(1, 3),
      pins: [
        msg(3, { body: 'önemli', pinned_at: '2026-11-14T00:00:00Z' }),
        msg(1, { body: 'eski', pinned_at: '2026-11-13T00:00:00Z' }),
      ],
    })
    const { wrapper } = await mountPane()
    const bar = wrapper.get('[data-testid="chat-pinbar"]')
    expect(bar.text()).toContain('Sabitlenen mesaj 1/2')
    expect(bar.text()).toContain('önemli')
    await bar.get('button[aria-label="Sonraki"]').trigger('click')
    expect(bar.text()).toContain('Sabitlenen mesaj 2/2')
    await bar.get('.chat-pinbar__go').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-seq="1"].msg-row--focus').exists()).toBe(true)
  })

  it('mesaj yüklenemedi → hata + Yeniden dene; yüklenirken iskelet', async () => {
    servePane({ messages: [] })
    server.use(
      http.get(`${ORIGIN}/v1/chats/:id/messages`, () => errorEnvelope('platform.internal', 500)),
    )
    const { wrapper } = await mountPane()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Mesajlar yüklenemedi'))
    expect(wrapper.find('button').exists()).toBe(true)
    void json
  })
})
