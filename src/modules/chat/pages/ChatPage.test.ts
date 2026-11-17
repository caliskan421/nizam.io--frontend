import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import ChatDialogs from '../components/ChatDialogs.vue'

import type * as SseModule from '@/shared/sse'

import { pageCrumb } from '@/shared/navigation/page-crumb'
import { useScopeStore } from '@/shared/scope/store'

import { conversationHandlers } from '../__tests__/conversation-handlers'
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
import ChatPage from './ChatPage.vue'

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

function summary(chatId: string, name: string) {
  return {
    auto_kind: null,
    chat_id: chatId,
    counterpart_account_id: null,
    counterpart_name: null,
    created_at: '2026-11-01T08:00:00Z',
    created_by_account_id: null,
    kind: 'group',
    last_message: null,
    last_message_at: null,
    last_seq: 0,
    mentioned: false,
    name,
    source: 'none',
    source_department_id: null,
    unread_count: 0,
  }
}

function serve(items: unknown[] = []) {
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
    http.get(`${ORIGIN}/v1/chats`, () => json({ items, next_cursor: '' })),
    http.get(`${ORIGIN}/v1/me/chat-unread`, () => json({ items: [] })),
    http.get(`${ORIGIN}/v1/chats/:id/messages`, () =>
      json({ items: range(1, 3), peer_read_seq: null, first_unread_seq: null }),
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
    ...conversationHandlers(),
  )
}

async function mountAt(path: string, attach = false) {
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
      attachTo: attach ? document.body : undefined,
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
    await vi.waitFor(() => {
      const reads = sent('GET', '/v1/chats/c1/messages')
      const window = reads.filter((r) => r.query.get('limit') === '50')
      const metadata = reads.filter((r) => r.query.get('limit') === '1')
      expect(window).toHaveLength(1)
      expect(metadata).toHaveLength(1)
      for (const read of [...window, ...metadata]) {
        expect(read.headers.get('X-Nizamio-Program')).toBe('p1')
        expect(read.query.get('before')).toBeNull()
        expect(read.query.get('after')).toBeNull()
        expect(read.query.get('around')).toBeNull()
      }
    })
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
    // p2 akış isteğinin sunucuya ulaşması bariyeri (gerçek süre beklemesi yok).
    const p2Arrived = new Promise<void>((resolve) => {
      const listener = ({ request }: { request: Request }) => {
        if (
          new URL(request.url).pathname === '/v1/chats/stream' &&
          request.headers.get('X-Nizamio-Program') === 'p2'
        ) {
          server.events.removeListener('request:start', listener)
          resolve()
        }
      }
      server.events.on('request:start', listener)
    })
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await flushPromises()
    await settleQueries(client)
    await p2Arrived
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

const LIST = [summary('c1', 'Eğitim Grubu'), summary('c2', 'Fuar kurulum')]

function stubNarrow(narrow: boolean) {
  vi.stubGlobal('matchMedia', () => ({
    matches: narrow,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
}
const active = () => document.activeElement as HTMLElement | null
const row = (id: string) => document.querySelector<HTMLElement>(`[data-chat-id="${id}"].chat-row`)

describe('ChatPage — kabuk, dar ekran ve odak (E-10-04, N-10-40, N-10-42)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it("iki sütun: liste her zaman, konuşma yuvası yanında; geniş ekranda Geri düğmesi DOM'da yok", async () => {
    serve(LIST)
    stubNarrow(false)
    const { wrapper } = await mountAt('/mesajlar/c1')
    expect(wrapper.find('[data-testid="chat-list-pane"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="conversation-pane"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="chat-back"]').exists()).toBe(false)
    expect(wrapper.get('.chat-row[aria-current="true"]').attributes('data-chat-id')).toBe('c1')
  })

  it('satır tıklaması sohbeti açar, süzgeç korunur, hedef mesaj sorgusu düşer', async () => {
    serve(LIST)
    const { wrapper, router } = await mountAt('/mesajlar?filtre=gruplar&mesaj=5')
    await wrapper.get('[data-chat-id="c2"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('collaboration.chat')
    expect(router.currentRoute.value.params.chatId).toBe('c2')
    expect(router.currentRoute.value.query).toEqual({ filtre: 'gruplar' })
    expect(wrapper.get('[data-testid="chat-page"]').attributes('data-pane')).toBe('conversation')
  })

  it('dar ekranda: Geri düğmesi listeye döner, süzgeç korunur ve odak o konuşmanın satırına gider', async () => {
    serve(LIST)
    stubNarrow(true)
    const { wrapper, router } = await mountAt('/mesajlar/c2?filtre=gruplar', true)
    const back = wrapper.get('[data-testid="chat-back"]')
    expect(back.text()).toBe('Geri')
    await back.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/mesajlar?filtre=gruplar')
    expect(wrapper.get('[data-testid="chat-page"]').attributes('data-pane')).toBe('list')
    expect(active()).toBe(row('c2'))
  })

  it('tarayıcı geri tuşu da aynı: odak satıra döner', async () => {
    serve(LIST)
    const { router } = await mountAt('/mesajlar', true)
    await router.push('/mesajlar/c1')
    await flushPromises()
    router.back()
    await flushPromises()
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/mesajlar')
    expect(active()).toBe(row('c1'))
  })

  it('kapanan sohbetin satırı listede yoksa odak aramaya düşer (gövdeye değil)', async () => {
    serve(LIST)
    const { router } = await mountAt('/mesajlar/c9', true)
    await router.push('/mesajlar')
    await flushPromises()
    await flushPromises()
    expect(active()?.getAttribute('data-testid')).toBe('chat-search')
  })

  it('dar ekranda satır seçince odak konuşma bölgesine geçer (liste gizlenir, odak gövdede kalmaz)', async () => {
    serve(LIST)
    stubNarrow(true)
    const { wrapper } = await mountAt('/mesajlar', true)
    ;(row('c1') as HTMLElement).focus()
    await wrapper.get('[data-chat-id="c1"]').trigger('click')
    await flushPromises()
    await flushPromises()
    expect(active()).toBe(wrapper.get('[data-testid="chat-thread"]').element)
  })

  it('dar ekranda odak, rota çözüldükten SONRA (bölge görünürken) taşınır', async () => {
    serve(LIST)
    stubNarrow(true)
    const { wrapper, router } = await mountAt('/mesajlar', true)
    const thread = wrapper.get('[data-testid="chat-thread"]').element as HTMLElement
    const seen: (string | undefined)[] = []
    const real = thread.focus.bind(thread)
    thread.focus = () => {
      seen.push(router.currentRoute.value.params.chatId as string | undefined)
      real()
    }
    await wrapper.get('[data-chat-id="c2"]').trigger('click')
    await flushPromises()
    expect(seen).toEqual(['c2'])
  })

  it('dar ekranda sohbet seçili değilken Geri düğmesi yok; yalnız liste', async () => {
    serve(LIST)
    stubNarrow(true)
    const { wrapper } = await mountAt('/mesajlar')
    expect(wrapper.find('[data-testid="chat-back"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="chat-page"]').attributes('data-pane')).toBe('list')
  })

  it('Yeni konuşma: pencere isteği açılır, kapanınca odak düğmeye döner', async () => {
    serve(LIST)
    const { wrapper } = await mountAt('/mesajlar', true)
    await wrapper.get('[data-testid="chat-new"]').trigger('click')
    const dialogs = wrapper.getComponent(ChatDialogs)
    expect(dialogs.props('request')).toEqual({ dialog: 'newGroup', mode: 'group' })
    ;(active() as HTMLElement).blur()
    dialogs.vm.$emit('close')
    await flushPromises()
    expect(dialogs.props('request')).toBeNull()
    expect(active()).toBe(wrapper.get('[data-testid="chat-new"]').element)
  })

  it('diğer pencereler kapanınca odak düğmeye ZORLANMAZ (ChatDialogs tetikleyiciye döndürür)', async () => {
    serve(LIST)
    const { wrapper } = await mountAt('/mesajlar/c1', true)
    // Tek açma yolu: konuşma başlığı `CHAT_DIALOG_OPENER` ile pencere ister (sayfa dışa açık yöntem sunmaz).
    await wrapper.get('.chat-thread__who').trigger('click')
    await flushPromises()
    const dialogs = wrapper.getComponent(ChatDialogs)
    expect(dialogs.props('request')).toEqual({ dialog: 'groupInfo', chatId: 'c1' })
    expect('openDialog' in wrapper.getComponent(ChatPage).vm).toBe(false)
    ;(active() as HTMLElement).blur()
    dialogs.vm.$emit('close')
    await flushPromises()
    expect(dialogs.props('request')).toBeNull()
    expect(active()).not.toBe(wrapper.get('[data-testid="chat-new"]').element)
  })

  it('program değişince açık sohbet kapanır (liste yeni programdan okunur); süzgeç korunur', async () => {
    serve(LIST)
    const { wrapper, router, client } = await mountAt('/mesajlar/c1?filtre=gruplar')
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await flushPromises()
    await settleQueries(client)
    expect(router.currentRoute.value.fullPath).toBe('/mesajlar?filtre=gruplar')
    expect(wrapper.get('[data-testid="chat-page"]').attributes('data-pane')).toBe('list')
  })

  it('geçersiz kimlik (404): "Bu konuşma bulunamadı" + listeye dön; konuşma bölmesi çizilmez', async () => {
    serve(LIST)
    const { wrapper, router } = await mountAt('/mesajlar/yok')
    const lost = wrapper.get('[data-testid="chat-not-found"]')
    expect(lost.text()).toContain('Bu konuşma bulunamadı')
    expect(wrapper.find('[data-testid="conversation-pane"]').exists()).toBe(false)
    await lost.get('button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('collaboration.chats')
  })
})
