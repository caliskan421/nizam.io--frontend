import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { msg } from '../../__tests__/fixtures'
import { http, HttpResponse, ORIGIN, resetAll, sent, server, signIn } from '../../__tests__/harness'
import { mountPane, servePane, settle, unmountAll } from '../__tests__/pane-harness'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(signIn)
afterEach(() => {
  vi.restoreAllMocks()
  resetAll()
  unmountAll()
})
afterAll(() => server.close())

it('geçmiş çapası alınana kadar görünür son mesaj okundu gönderilmez', async () => {
  const { fake } = servePane({ historyFirstUnreadSeq: 1, messages: [msg(1)] })
  let release!: () => void
  let arrived!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const reached = new Promise<void>((resolve) => {
    arrived = resolve
  })
  server.use(
    http.get(`${ORIGIN}/v1/chats/c1/messages`, async ({ request }) => {
      const limit = Number(new URL(request.url).searchParams.get('limit'))
      if (limit === 1) {
        arrived()
        await gate
      }
      return HttpResponse.json(fake.readSync({ limit }))
    }),
    http.post(`${ORIGIN}/v1/chats/c1/read`, () => {
      fake.firstUnread.seq = null
      return new HttpResponse(null, { status: 204 })
    }),
  )
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  const { wrapper, client } = await mountPane()
  try {
    await reached
    await vi.waitFor(() => expect(wrapper.find('[data-seq="1"]').exists()).toBe(true))
    const list = wrapper.get('.msg-list').element as HTMLElement
    const message = wrapper.get('[data-seq="1"]').element as HTMLElement
    vi.spyOn(list, 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 400 } as DOMRect)
    vi.spyOn(message, 'getBoundingClientRect').mockReturnValue({ top: 100, bottom: 150 } as DOMRect)
    Object.defineProperties(list, {
      scrollTop: { configurable: true, writable: true, value: 0 },
      scrollHeight: { configurable: true, value: 400 },
      clientHeight: { configurable: true, value: 400 },
    })
    list.dispatchEvent(new Event('scroll'))
    await new Promise((resolve) => setTimeout(resolve, 1400))
    const earlyReads = sent('POST', '/v1/chats/c1/read').length
    release()
    await new Promise((resolve) => setTimeout(resolve, 100))
    await settle(client)
    expect(earlyReads).toBe(0)
    await vi.waitFor(() => expect(wrapper.find('[data-testid="chat-unread"]').exists()).toBe(true))
    wrapper.get('.msg-list').element.dispatchEvent(new Event('scroll'))
    await vi.waitFor(() => expect(sent('POST', '/v1/chats/c1/read')).toHaveLength(1), {
      timeout: 2500,
    })
    await settle(client)
  } finally {
    release()
  }
}, 8000)
