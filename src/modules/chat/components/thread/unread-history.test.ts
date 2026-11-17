import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { msg, range } from '../../__tests__/fixtures'
import { resetAll, server, signIn } from '../../__tests__/harness'
import { mountPane, servePane, settle, unmountAll } from '../__tests__/pane-harness'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetAll()
  unmountAll()
})
afterAll(() => server.close())
beforeEach(signIn)

const DIVIDER = '[data-testid="chat-unread"]'

describe('okunmamış ayırıcı: liste özeti yokken geçmiş `first_unread_seq`', () => {
  it('sohbet ilk 50 dışında (özet yok): ayırıcı genel metinle first_unread_seq mesajının üstüne çizilir', async () => {
    const { fake } = servePane({ historyFirstUnreadSeq: 10, messages: range(1, 120) })
    const { wrapper, client } = await mountPane()
    await settle(client)
    await vi.waitFor(() => expect(wrapper.find(DIVIDER).exists()).toBe(true))
    expect(wrapper.get(DIVIDER).text()).toBe('Okunmamış mesajlar')
    expect(fake.reads.some((r) => r.around === 10)).toBe(true)
    const html = wrapper.get('.msg-list').element.innerHTML
    expect(html.indexOf('data-seq="10"')).toBeGreaterThan(html.indexOf('data-testid="chat-unread"'))
  })

  it('geçmişte first_unread_seq null: ayırıcı yok', async () => {
    servePane({ historyFirstUnreadSeq: null, messages: range(1, 10) })
    const { wrapper, client } = await mountPane()
    await settle(client)
    expect(wrapper.find(DIVIDER).exists()).toBe(false)
  })

  it('özet varsa özet önceliklidir: sayı özetten, çapa özetten', async () => {
    servePane({
      summary: { unread_count: 3, first_unread_seq: 8 },
      historyFirstUnreadSeq: 2,
      messages: range(1, 10),
    })
    const { wrapper, client } = await mountPane()
    await settle(client)
    await vi.waitFor(() => expect(wrapper.find(DIVIDER).exists()).toBe(true))
    expect(wrapper.get(DIVIDER).text()).toBe('3 okunmamış mesaj')
    const html = wrapper.get('.msg-list').element.innerHTML
    expect(html.indexOf('data-seq="8"')).toBeGreaterThan(html.indexOf('data-testid="chat-unread"'))
  })

  it('açık ?mesaj= hedefi korunur: around=first_unread_seq okunmaz, çapa yalnız ayırıcı konumu', async () => {
    const { fake } = servePane({ historyFirstUnreadSeq: 10, messages: range(1, 200) })
    const { wrapper, client } = await mountPane({ path: '/mesajlar/c1?mesaj=150' })
    await settle(client)
    await vi.waitFor(() =>
      expect(wrapper.find('[data-seq="150"].msg-row--focus').exists()).toBe(true),
    )
    expect(fake.reads.some((r) => r.around === 150)).toBe(true)
    expect(fake.reads.some((r) => r.around === 10)).toBe(false)
  })

  it('çapa dondurulur: sonradan gelen okundu sayfaları (first_unread_seq null) ayırıcıyı yitirmez', async () => {
    const { fake } = servePane({ historyFirstUnreadSeq: 3, messages: [msg(1), msg(2), msg(3)] })
    const { wrapper, client } = await mountPane()
    await settle(client)
    await vi.waitFor(() => expect(wrapper.find(DIVIDER).exists()).toBe(true))
    fake.firstUnread.seq = null
    fake.add(msg(4))
    await wrapper.vm.$nextTick()
    await settle(client)
    expect(wrapper.find(DIVIDER).exists()).toBe(true)
  })
  it('aynı query önbelleğiyle yeniden girişte eski okunmamış çapa tekrar çizilmez', async () => {
    const { fake } = servePane({ historyFirstUnreadSeq: 1, messages: [msg(1)] })
    const first = await mountPane()
    await settle(first.client)
    await vi.waitFor(() => expect(first.wrapper.find(DIVIDER).exists()).toBe(true))
    fake.firstUnread.seq = null
    first.wrapper.unmount()
    const second = await mountPane({ queryClient: first.client })
    await settle(second.client)
    expect(second.wrapper.find(DIVIDER).exists()).toBe(false)
  })
})
