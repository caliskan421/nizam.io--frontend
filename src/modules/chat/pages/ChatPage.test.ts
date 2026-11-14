import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import type * as SseModule from '@/shared/sse'

import { pageCrumb } from '@/shared/navigation/page-crumb'
import { useScopeStore } from '@/shared/scope/store'

import { range } from '../__tests__/fixtures'
import {
  errorEnvelope,
  http,
  HttpResponse,
  json,
  ORIGIN,
  resetAll,
  sent,
  server,
  settleQueries,
  signIn,
} from '../__tests__/harness'
import { chatRoutes } from '../routes'

// Akışın KAPATILDIĞI `shared/sse` tutamacından izlenir (msw akış iptalini güvenilir iletmez).
const sse = vi.hoisted(() => ({ opened: 0, closed: 0 }))
vi.mock('@/shared/sse', async (original) => {
  const mod = await original<typeof SseModule>()
  return {
    ...mod,
    openEventStream: (options: Parameters<typeof mod.openEventStream>[0]) => {
      sse.opened += 1
      const handle = mod.openEventStream(options)
      return {
        close: () => {
          sse.closed += 1
          handle.close()
        },
      }
    },
  }
})

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())
beforeEach(signIn)

function serve() {
  sse.opened = 0
  sse.closed = 0
  server.use(
    http.get(`${ORIGIN}/v1/chats/stream`, () => {
      return new HttpResponse(
        new ReadableStream({
          start(c) {
            c.enqueue(new TextEncoder().encode(': ok\n\n'))
          },
        }),
        { headers: { 'Content-Type': 'text/event-stream' } },
      )
    }),
    http.get(`${ORIGIN}/v1/chats`, () => json({ items: [], next_cursor: '' })),
    http.get(`${ORIGIN}/v1/me/chat-unread`, () => json({ items: [] })),
    http.get(`${ORIGIN}/v1/chats/:id/messages`, () =>
      json({ items: range(1, 3), peer_read_seq: null }),
    ),
    http.get(`${ORIGIN}/v1/chats/c1`, () =>
      json({ chat_id: 'c1', kind: 'group', name: 'Eğitim Grubu', role: 'member' }),
    ),
    http.get(`${ORIGIN}/v1/chats/c2`, () =>
      json({
        chat_id: 'c2',
        kind: 'direct',
        name: null,
        counterpart_name: 'Ayşe Yılmaz',
        role: 'member',
      }),
    ),
    http.get(`${ORIGIN}/v1/chats/yok`, () => errorEnvelope('messaging.chat_not_found', 404)),
  )
}

async function mountAt(path: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [...chatRoutes, { path: '/', name: 'home', component: { render: () => null } }],
  })
  await router.push(path)
  await router.isReady()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = mount(
    { template: '<RouterView />' },
    {
      global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient: client }]] },
    },
  )
  await flushPromises()
  await settleQueries(client)
  return { wrapper, router, client }
}

describe('ChatPage (sayfa sahibi)', () => {
  it('/mesajlar: yalnız liste (dar ekran P62), sohbet seçilmedi boş durumu; tek akış açılır', async () => {
    serve()
    const { wrapper } = await mountAt('/mesajlar')
    const page = wrapper.get('[data-testid="chat-page"]')
    expect(page.attributes('data-pane')).toBe('list')
    expect(wrapper.find('[data-testid="conversation-pane"]').exists()).toBe(false)
    expect(page.text()).toContain('Bir konuşma seçin')
    const streams = sent('GET', '/v1/chats/stream')
    expect(streams).toHaveLength(1)
    expect(streams[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(streams[0]!.headers.get('Authorization')).toBe('Bearer tok-1')
    expect(sent('GET', '/v1/chats/c1/messages')).toHaveLength(0)
  })

  it('/mesajlar/:chatId: yalnız konuşma; ayrıntı + pencere okunur; kırıntı sohbet adı (grup / birebir)', async () => {
    serve()
    const { wrapper, router, client } = await mountAt('/mesajlar/c1')
    expect(wrapper.get('[data-testid="chat-page"]').attributes('data-pane')).toBe('conversation')
    expect(wrapper.get('[data-testid="conversation-pane"]').attributes('data-chat-id')).toBe('c1')
    expect(sent('GET', '/v1/chats/c1')).toHaveLength(1)
    expect(sent('GET', '/v1/chats/c1/messages')).toHaveLength(1)
    expect(pageCrumb.value).toBe('Eğitim Grubu')
    await router.push('/mesajlar/c2')
    await flushPromises()
    await settleQueries(client)
    expect(pageCrumb.value).toBe('Ayşe Yılmaz')
    // Sohbet değişimi akışı yeniden AÇMAZ (tek akış sayfa sahibinde).
    expect(sent('GET', '/v1/chats/stream')).toHaveLength(1)
  })

  it('sayfa sökülünce akış iptal edilir ve kırıntı bırakılır', async () => {
    serve()
    const { wrapper } = await mountAt('/mesajlar/c1')
    expect(sse.closed).toBe(0)
    wrapper.unmount()
    await flushPromises()
    expect(sse.closed).toBe(1)
    expect(pageCrumb.value).toBeNull()
  })

  it('program değişince akış kapanır ve yeni programla açılır; sohbet gizlenmez', async () => {
    serve()
    const { wrapper, client } = await mountAt('/mesajlar')
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await flushPromises()
    await settleQueries(client)
    await new Promise((r) => setTimeout(r, 20))
    const streams = sent('GET', '/v1/chats/stream')
    expect(streams.map((s) => s.headers.get('X-Nizamio-Program'))).toEqual(['p1', 'p2'])
    expect(sse.opened).toBe(2)
    expect(sse.closed).toBe(1)
    expect(wrapper.find('[data-testid="chat-page"]').exists()).toBe(true)
  })

  it('erişilemeyen sohbet (404) sayfayı çökertmez; kırıntı sahte ad göstermez', async () => {
    serve()
    server.use(
      http.get(`${ORIGIN}/v1/chats/yok/messages`, () =>
        errorEnvelope('messaging.chat_not_found', 404),
      ),
    )
    const { wrapper } = await mountAt('/mesajlar/yok')
    expect(wrapper.find('[data-testid="chat-page"]').exists()).toBe(true)
    expect(pageCrumb.value).toBeNull()
  })
})
