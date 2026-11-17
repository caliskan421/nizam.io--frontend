import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { makeChatLastMessage, makeChatSummary } from '@/shared/api/__tests__/defaults'
import { useScopeStore } from '@/shared/scope/store'

import {
  errorEnvelope,
  http,
  json,
  noContent,
  ORIGIN,
  resetAll,
  sent,
  server,
  settleQueries,
  signIn,
} from '../../__tests__/harness'
import { useMarkChatRead } from '../../api/writes'
import type { ChatSummary } from '../../model/types'
import ChatListPane from '../ChatListPane.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  vi.useRealTimers()
  resetAll()
  document.body.innerHTML = ''
})
afterAll(() => server.close())
beforeEach(signIn)

function row(over: Partial<ChatSummary> & { chat_id: string }): ChatSummary {
  return makeChatSummary({
    created_at: '2026-11-01T08:00:00Z',
    last_seq: 1,
    name: over.chat_id,
    ...over,
  })
}

const GENERAL = row({
  chat_id: 'g',
  name: 'Genel',
  auto_kind: 'general',
  source: 'program',
  unread_count: 2,
  last_message_at: '2026-11-14T07:02:00Z',
  last_message: makeChatLastMessage({
    body: 'Kapanış yemeği için gün seçelim',
    created_at: '2026-11-14T07:02:00Z',
    message_id: 'm9',
    sender_account_id: 'acc-1',
    sender_name: 'Ben Ben',
    seq: 9,
  }),
})
const DEPT = row({
  chat_id: 'd',
  name: 'Sistem koordinatörlüğü',
  auto_kind: 'department',
  source: 'department',
  source_department_id: 'dep1',
  mentioned: true,
  unread_count: 1,
  last_message: makeChatLastMessage({
    body: 'Portal hazır',
    created_at: '2026-11-13T07:02:00Z',
    message_id: 'm8',
    sender_account_id: 'u3',
    sender_name: 'Mevlüt Aksoy',
    seq: 8,
  }),
})
const DIRECT = row({
  chat_id: 'p',
  kind: 'direct',
  name: null,
  counterpart_name: 'Kadir Özbek',
  unread_count: 120,
})
const FREE = row({ chat_id: 'f', name: 'Fuar kurulum' })

interface Serve {
  pages?: ChatSummary[][]
  unread?: number | null
}
let programHeaders: string[] = []
function serve({ pages = [[GENERAL, DEPT, DIRECT, FREE]], unread = 3 }: Serve = {}) {
  programHeaders = []
  server.use(
    http.get(`${ORIGIN}/v1/chats`, ({ request }) => {
      programHeaders.push(request.headers.get('X-Nizamio-Program') ?? '')
      const url = new URL(request.url)
      const index = Number(url.searchParams.get('cursor') ?? 0)
      const items = pages[index] ?? []
      const q = url.searchParams.get('q')
      const kind = url.searchParams.get('kind')
      const onlyUnread = url.searchParams.get('unread') === 'true'
      // Sunucu süzgeci (BE-081): `kind`/`unread`/`q` süzer; `total` süzülmüş toplamdır.
      const match = (c: ChatSummary) =>
        (q ? (c.name ?? c.counterpart_name ?? '').includes(q) : true) &&
        (kind ? c.kind === kind : true) &&
        (onlyUnread ? c.unread_count > 0 : true)
      const total = pages.flat().filter(match).length
      return json({
        items: items.filter(match),
        next_cursor: index + 1 < pages.length ? String(index + 1) : '',
        total,
      })
    }),
    http.get(`${ORIGIN}/v1/me/chat-unread`, () =>
      json({
        items:
          unread === null
            ? []
            : [{ program_id: 'p1', program_name: 'P', unread_chats: unread, mentioned: false }],
      }),
    ),
    http.get(`${ORIGIN}/v1/program/departments`, () =>
      json({ departments: [{ department_id: 'dep1', display_name: 'Sistem', code: 'sis' }] }),
    ),
  )
}

const Stub = { render: () => null }

async function mountPane(url = '/mesajlar', selectedId?: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/mesajlar', name: 'collaboration.chats', component: Stub },
      { path: '/mesajlar/:chatId', name: 'collaboration.chat', component: Stub },
    ],
  })
  await router.push(url)
  await router.isReady()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const wrapper = mount(ChatListPane, {
    props: { selectedId },
    attachTo: document.body,
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient: client }]] },
  })
  await flushPromises()
  await settleQueries(client)
  return { wrapper, router, client }
}

const names = (w: VueWrapper) => w.findAll('.chat-row__name').map((n) => n.text())
const tab = (w: VueWrapper, filter: string) => w.get(`[role="tab"][data-filter="${filter}"]`)

describe('ChatListPane — satırlar (E-10-08…E-10-15)', () => {
  it('sunucu sırasıyla çizilir (istemci yeniden sıralamaz); role=list; ad, zaman, önizleme', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-14T12:00:00Z'))
    serve()
    const { wrapper } = await mountPane()
    expect(names(wrapper)).toEqual([
      'Genel',
      'Sistem koordinatörlüğü',
      'Kadir Özbek',
      'Fuar kurulum',
    ])
    const list = wrapper.get('ul.chat-list__items')
    expect(list.attributes('role')).toBe('list')
    expect(wrapper.get('[data-chat-id="g"]').text()).toContain(
      'Sen: Kapanış yemeği için gün seçelim',
    )
    expect(wrapper.get('[data-chat-id="d"]').text()).toContain('Mevlüt: Portal hazır')
    expect(wrapper.get('[data-chat-id="g"] .chat-row__time').text()).toMatch(/^\d\d:\d\d$/)
  })

  it('rozetler: sayı, 99+, bahsetme "@"; erişim adları; sessiz rozeti yok', async () => {
    serve()
    const { wrapper } = await mountPane()
    const badge = (id: string) => wrapper.find(`[data-chat-id="${id}"] .chat-row__badge`)
    expect(badge('g').text()).toBe('2')
    expect(badge('g').attributes('aria-label')).toBe('2 okunmamış mesaj')
    expect(badge('d').text()).toBe('@')
    expect(badge('d').attributes('aria-label')).toBe('Sizi anan okunmamış mesaj var')
    expect(badge('p').text()).toBe('99+')
    expect(badge('f').exists()).toBe(false)
    expect(wrapper.find('.chat-row__badge--mute').exists()).toBe(false)
  })

  it('iğne yalnız sistem gruplarında; avatar: G, koordinatörlük kodu (katalogdan), kişi harfleri', async () => {
    serve()
    const { wrapper } = await mountPane()
    const pinned = wrapper.findAll('.chat-row__pin').map((p) => p.attributes('aria-label'))
    expect(pinned).toEqual(['Sistem grubu', 'Sistem grubu'])
    const av = (id: string) => wrapper.get(`[data-chat-id="${id}"] .chat-av`)
    expect(av('g').text()).toBe('G')
    expect(av('d').text()).toBe('SİS')
    expect(av('p').text()).toBe('KÖ')
    expect(av('f').text()).toBe('FK')
    expect(av('d').classes()).toContain('chat-av--code')
    expect(av('g').attributes('aria-hidden')).toBe('true')
  })

  it('koordinatörlük grubu yoksa katalog okuması hiç yapılmaz', async () => {
    serve({ pages: [[DIRECT, FREE]] })
    await mountPane()
    expect(sent('GET', '/v1/program/departments')).toHaveLength(0)
  })

  it('aria-current yalnız seçili satırda; tık select(chatId) yayar', async () => {
    serve()
    const { wrapper } = await mountPane('/mesajlar/d', 'd')
    const current = wrapper.findAll('[aria-current]')
    expect(current).toHaveLength(1)
    expect(current[0]!.attributes('data-chat-id')).toBe('d')
    await wrapper.get('[data-chat-id="p"]').trigger('click')
    expect(wrapper.emitted('select')).toEqual([['p']])
  })
})

describe('ChatListPane — arama (E-10-05)', () => {
  it("Enter gecikmeyi atlar; q sunucuya gider, boşalınca q'suz liste", async () => {
    serve()
    const { wrapper, client } = await mountPane()
    const input = wrapper.get('[data-testid="chat-search"]')
    await input.setValue('Fuar')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    await settleQueries(client)
    expect(sent('GET', '/v1/chats').at(-1)!.query.get('q')).toBe('Fuar')
    expect(names(wrapper)).toEqual(['Fuar kurulum'])
    await input.setValue('')
    await input.trigger('keydown', { key: 'Enter' })
    await settleQueries(client)
    // q'suz liste taze önbellekten döner (ilk sayfa, ilk imleç): ikinci q'suz istek yok.
    expect(sent('GET', '/v1/chats').filter((r) => !r.query.has('q'))).toHaveLength(1)
    expect(names(wrapper)).toHaveLength(4)
  })

  it('300 ms gecikme: yazarken istek gitmez; süre dolunca gider', async () => {
    serve()
    const { wrapper, client } = await mountPane()
    const before = sent('GET', '/v1/chats').length
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      await wrapper.get('[data-testid="chat-search"]').setValue('Fu')
      vi.advanceTimersByTime(299)
      await nextTick()
      expect(sent('GET', '/v1/chats')).toHaveLength(before)
      vi.advanceTimersByTime(1)
    } finally {
      vi.useRealTimers()
    }
    await flushPromises()
    await settleQueries(client)
    expect(sent('GET', '/v1/chats').at(-1)!.query.get('q')).toBe('Fu')
  })

  it('sonuç yok: "Eşleşen konuşma yok" (boş liste mesajı değil)', async () => {
    serve()
    const { wrapper, client } = await mountPane()
    await wrapper.get('[data-testid="chat-search"]').setValue('yokyok')
    await wrapper.get('[data-testid="chat-search"]').trigger('keydown', { key: 'Enter' })
    await settleQueries(client)
    expect(wrapper.get('[data-testid="chat-list-empty"]').text()).toContain('Eşleşen konuşma yok')
    expect(wrapper.find('ul.chat-list__items').exists()).toBe(false)
  })

  it('program değişince arama kutusu temizlenir ve yeni program başlığıyla okunur', async () => {
    serve()
    const { wrapper, client } = await mountPane()
    await wrapper.get('[data-testid="chat-search"]').setValue('Fuar')
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await flushPromises()
    await settleQueries(client)
    expect((wrapper.get('[data-testid="chat-search"]').element as HTMLInputElement).value).toBe('')
    expect(programHeaders.at(-1)).toBe('p2')
    expect(sent('GET', '/v1/chats').filter((r) => r.query.get('q') === 'Fuar')).toHaveLength(0)
  })
})

describe('ChatListPane — süzgeç sekmeleri (E-10-06, E-10-07)', () => {
  it('Okunmamış: sunucu süzer (unread=true), URL ?filtre=okunmamis; Tümü sorguyu kaldırır', async () => {
    serve()
    const { wrapper, router, client } = await mountPane()
    await tab(wrapper, 'unread').trigger('click')
    await settleQueries(client)
    expect(router.currentRoute.value.query.filtre).toBe('okunmamis')
    expect(names(wrapper)).toEqual(['Genel', 'Sistem koordinatörlüğü', 'Kadir Özbek'])
    expect(sent('GET', '/v1/chats').at(-1)!.query.get('unread')).toBe('true')
    await tab(wrapper, 'groups').trigger('click')
    await settleQueries(client)
    expect(names(wrapper)).toEqual(['Genel', 'Sistem koordinatörlüğü', 'Fuar kurulum'])
    expect(sent('GET', '/v1/chats').at(-1)!.query.get('kind')).toBe('group')
    expect(sent('GET', '/v1/chats').at(-1)!.query.get('unread')).toBeNull()
    await tab(wrapper, 'people').trigger('click')
    await settleQueries(client)
    expect(names(wrapper)).toEqual(['Kadir Özbek'])
    await tab(wrapper, 'all').trigger('click')
    await settleQueries(client)
    expect(router.currentRoute.value.query.filtre).toBeUndefined()
    expect(names(wrapper)).toHaveLength(4)
  })

  it('URL ?filtre= ile açılış süzgeci kurar ve sunucuya `kind` gider (BE-081); etkin sekme sayacı `total`', async () => {
    serve()
    const { wrapper } = await mountPane('/mesajlar?filtre=kisiler')
    expect(tab(wrapper, 'people').attributes('aria-selected')).toBe('true')
    expect(names(wrapper)).toEqual(['Kadir Özbek'])
    const q = sent('GET', '/v1/chats')[0]!.query
    expect([...q.keys()].sort()).toEqual(['kind', 'limit'])
    expect(q.get('kind')).toBe('direct')
    expect(tab(wrapper, 'people').get('.chat-tabs__n').text()).toBe('1')
  })

  it('süzgeç sorgusu dışındaki sorgular (mesaj) korunur', async () => {
    serve()
    const { wrapper, router } = await mountPane('/mesajlar?mesaj=7')
    await tab(wrapper, 'groups').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ mesaj: '7', filtre: 'gruplar' })
  })

  it('klavye: ←/→ odağı taşır ve sekmeyi seçer; gezici tabindex', async () => {
    serve()
    const { wrapper, router } = await mountPane()
    expect(tab(wrapper, 'all').attributes('tabindex')).toBe('0')
    expect(tab(wrapper, 'unread').attributes('tabindex')).toBe('-1')
    ;(tab(wrapper, 'all').element as HTMLElement).focus()
    await tab(wrapper, 'all').trigger('keydown', { key: 'ArrowRight' })
    await flushPromises()
    expect(document.activeElement).toBe(tab(wrapper, 'unread').element)
    expect(router.currentRoute.value.query.filtre).toBe('okunmamis')
    await tab(wrapper, 'unread').trigger('keydown', { key: 'End' })
    await flushPromises()
    expect(router.currentRoute.value.query.filtre).toBe('kisiler')
  })

  it('sekme sayacı kesin unread_chats değeridir (yüklenen sayfalardan bağımsız)', async () => {
    serve({ unread: 7 })
    const { wrapper } = await mountPane()
    expect(tab(wrapper, 'unread').get('.chat-tabs__n').text()).toBe('7')
    expect(tab(wrapper, 'all').find('.chat-tabs__n').exists()).toBe(false)
  })

  it('program satırı yoksa, sayı 0 ise ya da özet hata verirse sayaç gizli', async () => {
    serve({ unread: null })
    expect(
      tab((await mountPane()).wrapper, 'unread')
        .find('.chat-tabs__n')
        .exists(),
    ).toBe(false)
    serve({ unread: 0 })
    expect(
      tab((await mountPane()).wrapper, 'unread')
        .find('.chat-tabs__n')
        .exists(),
    ).toBe(false)
    serve()
    server.use(
      http.get(`${ORIGIN}/v1/me/chat-unread`, () => errorEnvelope('platform.internal', 500)),
    )
    expect(
      tab((await mountPane()).wrapper, 'unread')
        .find('.chat-tabs__n')
        .exists(),
    ).toBe(false)
  })

  it('aria-controls liste çizilince listeyi gösterir; liste yokken verilmez (KESİN 27)', async () => {
    serve()
    const { wrapper } = await mountPane()
    const list = wrapper.get('ul.chat-list__items')
    expect(tab(wrapper, 'all').attributes('aria-controls')).toBe(list.attributes('id'))
    serve({ pages: [[]] })
    const empty = await mountPane()
    expect(empty.wrapper.find('ul.chat-list__items').exists()).toBe(false)
    expect(tab(empty.wrapper, 'all').attributes('aria-controls')).toBeUndefined()
  })
})

describe('ChatListPane — sayfalama ve durumlar', () => {
  const page2 = [row({ chat_id: 'z', name: 'Son sayfa' })]

  it('"Daha fazla yükle" imleçle sonraki sayfayı ekler; son sayfada düğme kalkar', async () => {
    serve({ pages: [[GENERAL, FREE], page2] })
    const { wrapper, client } = await mountPane()
    const more = wrapper.get('.chat-list__more button')
    expect(more.text()).toBe('Daha fazla yükle')
    await more.trigger('click')
    await settleQueries(client)
    expect(names(wrapper)).toEqual(['Genel', 'Fuar kurulum', 'Son sayfa'])
    expect(sent('GET', '/v1/chats').at(-1)!.query.get('cursor')).toBe('1')
    expect(wrapper.find('.chat-list__more').exists()).toBe(false)
  })

  it('süzgeç açıkken sayfalama süzülmüş kümede sürer; "yüklenen konuşmalar içinde" etiketi yok (eski yol)', async () => {
    serve({ pages: [[GENERAL], [DEPT, FREE]] })
    const { wrapper, client } = await mountPane('/mesajlar?filtre=okunmamis')
    expect(wrapper.find('.chat-list__hint').exists()).toBe(false)
    expect(names(wrapper)).toEqual(['Genel'])
    expect(tab(wrapper, 'unread').get('.chat-tabs__n').text()).toBe('2')
    await wrapper.get('.chat-list__more button').trigger('click')
    await settleQueries(client)
    expect(names(wrapper)).toEqual(['Genel', 'Sistem koordinatörlüğü'])
    const calls = sent('GET', '/v1/chats')
    expect(calls.every((r) => r.query.get('unread') === 'true')).toBe(true)
    expect(calls.at(-1)!.query.get('cursor')).toBe('1')
  })

  it('yükleniyor: durum metni (role=status); veri gelince kalkar', async () => {
    serve()
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get(`${ORIGIN}/v1/chats`, async () => {
        await gate
        return json({ items: [FREE], next_cursor: '' })
      }),
    )
    const { wrapper, client } = await (async () => {
      const pinia = createPinia()
      setActivePinia(pinia)
      useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
      const router: Router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/mesajlar', name: 'collaboration.chats', component: Stub }],
      })
      await router.push('/mesajlar')
      const c = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const w = mount(ChatListPane, {
        global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient: c }]] },
      })
      await flushPromises()
      return { wrapper: w, client: c }
    })()
    const loading = wrapper.get('[data-testid="chat-list-loading"]')
    expect(loading.attributes('role')).toBe('status')
    expect(loading.text()).toBe('Konuşmalar yükleniyor…')
    release()
    await settleQueries(client)
    expect(wrapper.find('[data-testid="chat-list-loading"]').exists()).toBe(false)
    expect(names(wrapper)).toEqual(['Fuar kurulum'])
  })

  it('hata: kodu metne çevrilir (sunucu iletisi yok), "Yeniden dene" yeniden okur', async () => {
    serve()
    server.use(http.get(`${ORIGIN}/v1/chats`, () => errorEnvelope('messaging.chat_not_found', 404)))
    const { wrapper, client } = await mountPane()
    const error = wrapper.get('[data-testid="chat-list-error"]')
    expect(error.attributes('role')).toBe('alert')
    expect(error.text()).toContain('Konuşmalar yüklenemedi.')
    expect(error.text()).not.toContain('sunucu iletisi')
    serve()
    await error.get('button').trigger('click')
    await settleQueries(client)
    expect(wrapper.find('[data-testid="chat-list-error"]').exists()).toBe(false)
    expect(names(wrapper)).toHaveLength(4)
  })

  it('hiç konuşma yok: "Henüz konuşma yok" + Yeni konuşma (create yayar)', async () => {
    serve({ pages: [[]] })
    const { wrapper } = await mountPane()
    const empty = wrapper.get('[data-testid="chat-list-empty"]')
    expect(empty.text()).toContain('Henüz konuşma yok')
    await empty.get('button').trigger('click')
    expect(wrapper.emitted('create')).toEqual([['group']])
  })

  it('süzgeç sonucu boş: "Eşleşen konuşma yok", Yeni konuşma düğmesi yok', async () => {
    serve({ pages: [[FREE]] })
    const { wrapper } = await mountPane('/mesajlar?filtre=okunmamis')
    const empty = wrapper.get('[data-testid="chat-list-empty"]')
    expect(empty.text()).toContain('Eşleşen konuşma yok')
    expect(empty.find('button').exists()).toBe(false)
  })
})

describe('ChatListPane — başlık, odak, okundu uzlaştırması', () => {
  it('başlık "Mesajlar" (h1); kalem düğmesi create(group) yayar ve erişim adı taşır', async () => {
    serve()
    const { wrapper } = await mountPane()
    expect(wrapper.get('h1').text()).toBe('Mesajlar')
    const button = wrapper.get('[data-testid="chat-new"]')
    expect(button.attributes('aria-label')).toBe('Yeni konuşma veya grup')
    await button.trigger('click')
    expect(wrapper.emitted('create')).toEqual([['group']])
    expect(wrapper.get('section').attributes('aria-label')).toBe('Konuşmalar')
  })

  it('odak işleri: satıra, düğmeye, aramaya; olmayan satır false', async () => {
    serve()
    const { wrapper } = await mountPane()
    const handle = wrapper.vm as unknown as {
      focusRow(id: string): boolean
      focusCreate(): boolean
      focusSearch(): boolean
    }
    expect(handle.focusRow('d')).toBe(true)
    expect(document.activeElement).toBe(wrapper.get('[data-chat-id="d"]').element)
    expect(handle.focusRow('yok')).toBe(false)
    expect(handle.focusCreate()).toBe(true)
    expect(document.activeElement).toBe(wrapper.get('[data-testid="chat-new"]').element)
    expect(handle.focusSearch()).toBe(true)
    expect(document.activeElement).toBe(wrapper.get('[data-testid="chat-search"]').element)
  })

  it('okundu yazması (markChatRead) listeyi VE sekme sayacını yeniden okutur (KESİN 29)', async () => {
    serve()
    let read = false
    server.use(
      http.get(`${ORIGIN}/v1/chats`, () =>
        json({ items: [read ? { ...GENERAL, unread_count: 0 } : GENERAL], next_cursor: '' }),
      ),
      http.get(`${ORIGIN}/v1/me/chat-unread`, () =>
        json({
          items: [
            { program_id: 'p1', program_name: 'P', unread_chats: read ? 0 : 3, mentioned: false },
          ],
        }),
      ),
      http.post(`${ORIGIN}/v1/chats/g/read`, () => {
        read = true
        return noContent()
      }),
    )
    const pinia = createPinia()
    setActivePinia(pinia)
    useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/mesajlar', name: 'collaboration.chats', component: Stub }],
    })
    await router.push('/mesajlar')
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    let mark!: ReturnType<typeof useMarkChatRead>
    const Host = {
      setup() {
        mark = useMarkChatRead()
        return () => h(ChatListPane)
      },
    }
    const wrapper = mount(Host, {
      global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient: client }]] },
    })
    await flushPromises()
    await settleQueries(client)
    expect(wrapper.get('.chat-row__badge').text()).toBe('2')
    expect(tab(wrapper, 'unread').get('.chat-tabs__n').text()).toBe('3')
    await mark.submit({ programId: 'p1', chatId: 'g', messageId: 'm9' })
    await settleQueries(client)
    expect(wrapper.find('.chat-row__badge').exists()).toBe(false)
    expect(tab(wrapper, 'unread').find('.chat-tabs__n').exists()).toBe(false)
  })
})
