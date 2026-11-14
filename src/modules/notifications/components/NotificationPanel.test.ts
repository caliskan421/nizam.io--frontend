// Panel gövdesi: GERÇEK API istemcisi + MSW + gerçek Pinia/TanStack Query (KESİN 11). Saat sahte
// (`vi.setSystemTime`); yerleşme `settleQueries` ile, sabit süre beklemesi yok.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'
import { useInstanceStore } from '@/shared/instance/store'
import { useToast } from '@/shared/ui'

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
} from '../__tests__/harness'
import NotificationPanel from './NotificationPanel.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetAll()
  useToast().clear()
  vi.useRealTimers()
  document.body.innerHTML = ''
})
afterAll(() => server.close())
beforeEach(() => {
  signIn()
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-14T09:00:00Z') })
})

let seq = 0
const item = (over: Record<string, unknown> = {}) => ({
  id: `n${++seq}`,
  type: 'work.item.created',
  subject_ref: { kind: 'work_item', id: 'w-1' },
  is_read: false,
  created_at: '2026-11-14T08:55:00Z',
  ...over,
})
const LIST = `${ORIGIN}/v1/notifications`

function serve(items: unknown[], extra: Record<string, unknown> = {}) {
  server.use(
    http.get(LIST, () => json({ items, unread_count: items.length, ...extra })),
    // Panel altındaki Web Push kutusu (W159) VAPID anahtarını okur; kapalı → kutu çizilmez.
    http.get(`${ORIGIN}/v1/notifications/vapid-public-key`, () =>
      json({ enabled: false, public_key: '' }),
    ),
  )
}

async function mountPanel(open = true) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useInstanceStore().profile = { timezone: 'Europe/Istanbul' } as never
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const wrapper = mount(NotificationPanel, {
    props: { open },
    attachTo: document.body,
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
  })
  await flushPromises()
  return { wrapper, client }
}
const settle = async (client: QueryClient, wrapper: VueWrapper) => {
  await settleQueries(client)
  await wrapper.vm.$nextTick()
}
const rows = (wrapper: VueWrapper) => wrapper.findAll('[data-testid="notification-row"]')
const tabs = (wrapper: VueWrapper) => wrapper.findAll('[role="tab"]')

describe('liste okuma', () => {
  it('kapalıyken istek yok ve DOM yok; açılınca limit=30 ile okunur', async () => {
    serve([item()])
    const { wrapper, client } = await mountPanel(false)
    await settleQueries(client)
    expect(sent('GET', '/v1/notifications')).toHaveLength(0)
    expect(wrapper.find('[data-testid="notification-panel"]').exists()).toBe(false)
    await wrapper.setProps({ open: true })
    await settle(client, wrapper)
    expect(sent('GET', '/v1/notifications')[0]!.query.get('limit')).toBe('30')
    expect(rows(wrapper)).toHaveLength(1)
  })

  it('yüklenirken iskelet (aria-busy); sonra Bugün / Dün / Daha eski grupları, sunucu sırası', async () => {
    serve([
      item({ id: 'a', created_at: '2026-11-14T08:59:40Z' }),
      item({ id: 'b', created_at: '2026-11-14T06:00:00Z' }),
      item({ id: 'c', created_at: '2026-11-13T20:05:00Z' }),
      item({ id: 'd', created_at: '2026-10-02T07:30:00Z' }),
    ])
    const { wrapper, client } = await mountPanel()
    expect(wrapper.find('[data-testid="notification-loading"]').exists()).toBe(true)
    await settle(client, wrapper)
    expect(wrapper.find('[data-testid="notification-loading"]').exists()).toBe(false)
    expect(wrapper.findAll('.nb-grp').map((g) => g.text())).toEqual(['Bugün', 'Dün', 'Daha eski'])
    const times = wrapper.findAll('time').map((t) => t.text())
    expect(times).toEqual(['şimdi', '3 sa', '23:05', '02.10 10:30'])
  })

  it('boş grup çizilmez (yalnız dünün kaydı varsa tek grup)', async () => {
    serve([item({ created_at: '2026-11-13T20:05:00Z' })])
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    expect(wrapper.findAll('.nb-grp').map((g) => g.text())).toEqual(['Dün'])
  })

  it('boş durum: Tümü "Henüz bildirim yok"; Okunmamış "Okunmamış bildirim yok"', async () => {
    serve([])
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    expect(wrapper.get('.rp-empty').text()).toContain('Henüz bildirim yok')
    await tabs(wrapper)[2]!.trigger('click')
    expect(wrapper.get('.rp-empty').text()).toContain('Okunmamış bildirim yok')
  })

  it('hata: ortak hata durumu + yeniden dene (sunucu message gösterilmez)', async () => {
    server.use(http.get(LIST, () => errorEnvelope('platform.internal', 400)))
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    expect(wrapper.get('[role="alert"]').text()).toContain('Bildirimler yüklenemedi.')
    expect(wrapper.text()).not.toContain('sunucu iletisi')
    serve([item()])
    await wrapper.get('[role="alert"] button').trigger('click')
    await settle(client, wrapper)
    expect(rows(wrapper)).toHaveLength(1)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('bilinmeyen tür: genel "Yeni bildirim" satırı (sessiz düşürme yok)', async () => {
    serve([item({ type: 'yeni.olay', subject_ref: { kind: 'x', id: 'y' } })])
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    expect(rows(wrapper)[0]!.text()).toContain('Yeni bildirim')
  })
})

describe('sekmeler', () => {
  it('Senden bekleyen devre dışı + "Yakında" (BE-144); Tümü seçili; sekme değişimi istek atmaz', async () => {
    serve([item({ id: 'u1' }), item({ id: 'r1', is_read: true })], { unread_count: 1 })
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    const [awaiting, all, unread] = tabs(wrapper)
    expect(awaiting!.attributes('disabled')).toBeDefined()
    expect(awaiting!.text()).toContain('Yakında')
    expect(all!.attributes('aria-selected')).toBe('true')
    expect(unread!.text()).toContain('1')
    expect(rows(wrapper)).toHaveLength(2)
    await unread!.trigger('click')
    expect(rows(wrapper)).toHaveLength(1)
    expect(rows(wrapper)[0]!.attributes('data-unread')).toBe('true')
    expect(sent('GET', '/v1/notifications')).toHaveLength(1)
  })

  it("panel kapanıp açılınca sekme Tümü'ye döner", async () => {
    serve([item({ is_read: true })], { unread_count: 0 })
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    await tabs(wrapper)[2]!.trigger('click')
    expect(tabs(wrapper)[2]!.attributes('aria-selected')).toBe('true')
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    await settle(client, wrapper)
    expect(tabs(wrapper)[1]!.attributes('aria-selected')).toBe('true')
  })

  it('Okunmamış sekmesinde yüklü küme boş ama sayfa varken boş durum yok, "Daha eski" açık', async () => {
    serve([item({ is_read: true })], { unread_count: 3, next_cursor: 'c2' })
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    await tabs(wrapper)[2]!.trigger('click')
    expect(wrapper.find('.rp-empty').exists()).toBe(false)
    expect(wrapper.find('[data-testid="notification-older"]').exists()).toBe(true)
  })
})

describe('Daha eski bildirimler', () => {
  it('imleçle sonraki sayfayı ekler; imleç bitince düğme kalkar', async () => {
    server.use(
      http.get(LIST, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        return cursor
          ? json({ items: [item({ id: 'p2' })], unread_count: 2 })
          : json({ items: [item({ id: 'p1' })], unread_count: 2, next_cursor: 'c2' })
      }),
    )
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    expect(rows(wrapper)).toHaveLength(1)
    await wrapper.get('[data-testid="notification-older"]').trigger('click')
    await settle(client, wrapper)
    expect(rows(wrapper)).toHaveLength(2)
    expect(sent('GET', '/v1/notifications')[1]!.query.get('cursor')).toBe('c2')
    expect(wrapper.find('[data-testid="notification-older"]').exists()).toBe(false)
  })

  it('sonraki sayfa başarısız: liste korunur, kısa hata + yeniden dene', async () => {
    let fail = true
    server.use(
      http.get(LIST, ({ request }) => {
        if (new URL(request.url).searchParams.get('cursor')) {
          return fail
            ? errorEnvelope('platform.internal', 400)
            : json({ items: [item({ id: 'p2' })], unread_count: 2 })
        }
        return json({ items: [item({ id: 'p1' })], unread_count: 2, next_cursor: 'c2' })
      }),
    )
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    await wrapper.get('[data-testid="notification-older"]').trigger('click')
    await settle(client, wrapper)
    expect(rows(wrapper)).toHaveLength(1)
    expect(wrapper.get('.nb-more--error').text()).toContain('Daha eski bildirimler yüklenemedi.')
    fail = false
    await wrapper.get('.nb-more--error button').trigger('click')
    await settle(client, wrapper)
    expect(rows(wrapper)).toHaveLength(2)
  })
})

describe('okundu akışı', () => {
  it('okunmamış satır: yazma + gezinme BİRLİKTE; gezinme yanıtı beklemez; başarıda liste + sayaç yenilenir', async () => {
    serve([item({ id: 'u1' })])
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    server.use(
      http.post(`${LIST}/u1/read`, async () => {
        await gate
        return noContent()
      }),
      http.get(`${LIST}/unread-count`, () => json({ count: 1 })),
    )
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    await rows(wrapper)[0]!.get('.nb-it__main').trigger('click')
    expect(wrapper.emitted('navigate')).toEqual([
      [{ route: 'work.tasks', params: {}, query: { gorev: 'w-1' } }],
    ])
    // Yazma sürerken: iyimser değişim yok (nokta duruyor), satır meşgul.
    expect(rows(wrapper)[0]!.attributes('data-unread')).toBe('true')
    expect(rows(wrapper)[0]!.attributes('aria-busy')).toBe('true')
    const listCalls = sent('GET', '/v1/notifications').length
    release()
    await settle(client, wrapper)
    const post = sent('POST', '/v1/notifications/u1/read')[0]!
    expect(post.headers.get('X-Requested-With')).toBeTruthy()
    expect(post.headers.get('Idempotency-Key')).toBeNull()
    expect(sent('GET', '/v1/notifications').length).toBeGreaterThan(listCalls)
  })

  it('okunmuş satır yalnız gezinir (yazma yok)', async () => {
    serve([item({ is_read: true })], { unread_count: 0 })
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    await rows(wrapper)[0]!.get('.nb-it__main').trigger('click')
    expect(wrapper.emitted('navigate')).toHaveLength(1)
    expect(sent('POST', '/v1/notifications/n1/read')).toHaveLength(0)
  })

  it('membership: yalnız okundu, gezinme yok, panel açık', async () => {
    serve([
      item({
        id: 'm1',
        type: 'organization.membership.assigned',
        subject_ref: { kind: 'membership', id: 'x' },
      }),
    ])
    server.use(http.post(`${LIST}/m1/read`, () => noContent()))
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    await rows(wrapper)[0]!.get('.nb-it__main').trigger('click')
    await settle(client, wrapper)
    expect(sent('POST', '/v1/notifications/m1/read')).toHaveLength(1)
    expect(wrapper.emitted('navigate')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('"Okundu say" satırı açmaz; çift tık tek istek', async () => {
    serve([item({ id: 'u1' })])
    server.use(http.post(`${LIST}/u1/read`, () => noContent()))
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    const button = rows(wrapper)[0]!.get('.nb-hov button')
    await button.trigger('click')
    await button.trigger('click')
    await settle(client, wrapper)
    expect(sent('POST', '/v1/notifications/u1/read')).toHaveLength(1)
    expect(wrapper.emitted('navigate')).toBeUndefined()
  })

  it('404 notification_not_found: sessiz (bildirim yok); liste yeniden okunur, satır düşer', async () => {
    serve([item({ id: 'gone' }), item({ id: 'kept' })])
    server.use(
      http.post(`${LIST}/gone/read`, () =>
        errorEnvelope('notifications.notification_not_found', 404),
      ),
    )
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    expect(rows(wrapper)).toHaveLength(2)
    serve([item({ id: 'kept' })])
    await rows(wrapper)[0]!.get('.nb-hov button').trigger('click')
    await settle(client, wrapper)
    expect(rows(wrapper)).toHaveLength(1)
    expect(useToast().queue.value.length).toBe(0)
  })

  it('başka hata (500): danger bildirimi, sunucu message yok; satır okunmamış kalır', async () => {
    serve([item({ id: 'u1' })])
    server.use(http.post(`${LIST}/u1/read`, () => errorEnvelope('platform.internal', 500)))
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    await rows(wrapper)[0]!.get('.nb-hov button').trigger('click')
    await settle(client, wrapper)
    const toasts = useToast().queue.value
    expect(toasts.length).toBe(1)
    expect(toasts[0]!.tone).toBe('danger')
    expect(toasts[0]!.message).not.toContain('sunucu iletisi')
    expect(rows(wrapper)[0]!.attributes('data-unread')).toBe('true')
  })

  it('panel yazma sürerken sökülürse geç sonuç bildirim üretmez (sahip yaşamı)', async () => {
    serve([item({ id: 'u1' })])
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    server.use(
      http.post(`${LIST}/u1/read`, async () => {
        await gate
        return errorEnvelope('platform.internal', 500)
      }),
    )
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    await rows(wrapper)[0]!.get('.nb-hov button').trigger('click')
    wrapper.unmount()
    release()
    await settleQueries(client)
    expect(useToast().queue.value.length).toBe(0)
  })
})

describe('Tümünü okundu say', () => {
  it('okunmamış varken etkin; başarıda marked_count bildirimi; sayaç + liste yenilenir', async () => {
    serve([item({ id: 'u1' }), item({ id: 'u2' })])
    server.use(
      http.post(`${LIST}/read-all`, () => json({ marked_count: 2 })),
      http.get(`${LIST}/unread-count`, () => json({ count: 0 })),
    )
    const { wrapper, client } = await mountPanel()
    client.setQueryData(queryKeys.notifications.unreadCount(), 2)
    await settle(client, wrapper)
    const button = wrapper.get('[data-testid="notification-mark-all"]')
    expect(button.attributes('disabled')).toBeUndefined()
    const before = sent('GET', '/v1/notifications').length
    await button.trigger('click')
    await settle(client, wrapper)
    expect(sent('POST', '/v1/notifications/read-all')).toHaveLength(1)
    expect(useToast().queue.value[0]!.message).toBe('2 bildirim okundu sayıldı')
    expect(sent('GET', '/v1/notifications').length).toBeGreaterThan(before)
    expect(client.getQueryState(queryKeys.notifications.unreadCount())?.isInvalidated).toBe(true)
  })

  it('marked_count 0 → "Okunmamış bildirim yok"', async () => {
    serve([item()])
    server.use(http.post(`${LIST}/read-all`, () => json({ marked_count: 0 })))
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    await wrapper.get('[data-testid="notification-mark-all"]').trigger('click')
    await settle(client, wrapper)
    expect(useToast().queue.value[0]!.message).toBe('Okunmamış bildirim yok')
  })

  it('okunmamış yokken devre dışı; yükleme sürerken devre dışı', async () => {
    serve([item({ is_read: true })], { unread_count: 0 })
    const { wrapper, client } = await mountPanel()
    expect(
      wrapper.get('[data-testid="notification-mark-all"]').attributes('disabled'),
    ).toBeDefined()
    await settle(client, wrapper)
    expect(
      wrapper.get('[data-testid="notification-mark-all"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('yazma sürerken aria-busy ve ikinci tık yok sayılır; hata → danger bildirimi', async () => {
    serve([item()])
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    server.use(
      http.post(`${LIST}/read-all`, async () => {
        await gate
        return errorEnvelope('platform.internal', 500)
      }),
    )
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    const button = wrapper.get('[data-testid="notification-mark-all"]')
    await button.trigger('click')
    expect(button.attributes('aria-busy')).toBe('true')
    await button.trigger('click')
    release()
    await settle(client, wrapper)
    expect(sent('POST', '/v1/notifications/read-all')).toHaveLength(1)
    expect(useToast().queue.value[0]!.tone).toBe('danger')
  })
})

describe('kapanış istekleri ve erişilebilirlik', () => {
  it('rol dialog + ad; geniş ekranda modal değil, ✕ yok', async () => {
    serve([item()])
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    const panel = wrapper.get('[data-testid="notification-panel"]')
    expect(panel.attributes('role')).toBe('dialog')
    expect(panel.attributes('aria-label')).toBe('Bildirimler')
    expect(panel.attributes('aria-modal')).toBeUndefined()
    expect(wrapper.find('[data-testid="notification-close"]').exists()).toBe(false)
  })

  it('Esc kapanış ister; panel içindeki tık istemez; dışarıdaki tık ister', async () => {
    serve([item()])
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    wrapper
      .get('[data-testid="notification-panel"]')
      .element.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    expect(wrapper.emitted('close')).toBeUndefined()
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    expect(wrapper.emitted('close')).toHaveLength(1)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toHaveLength(2)
  })

  it("zil (aria-controls) tıklaması dış tık sayılmaz; başka bir üst katman Esc'yi işlediyse kapanmaz", async () => {
    serve([item()])
    const trigger = document.createElement('button')
    trigger.setAttribute('aria-controls', 'notification-panel')
    document.body.append(trigger)
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    trigger.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    expect(wrapper.emitted('close')).toBeUndefined()
    const esc = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })
    esc.preventDefault()
    document.dispatchEvent(esc)
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('açılışta odak ilk etkin öğeye: okunmamış varken "Tümünü okundu say"', async () => {
    serve([item()])
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    await settle(client, wrapper)
    expect(document.activeElement).toBe(
      wrapper.get('[data-testid="notification-mark-all"]').element,
    )
  })

  it('okunmamış yokken odak ilk etkin sekmeye (devre dışı sekme atlanır)', async () => {
    serve([item({ is_read: true })], { unread_count: 0 })
    const { wrapper, client } = await mountPanel(false)
    await wrapper.setProps({ open: true })
    await settle(client, wrapper)
    await wrapper.vm.$nextTick()
    // Liste gelmeden açılış odağı verildi: ilk etkin öğe "Tümü" sekmesi (ya da kök).
    expect([
      tabs(wrapper)[1]!.element,
      wrapper.get('[data-testid="notification-panel"]').element,
    ]).toContain(document.activeElement)
  })

  it('kapanınca belge dinleyicileri kalkar (Esc bir daha istek yaymaz)', async () => {
    serve([item()])
    const { wrapper, client } = await mountPanel()
    await settle(client, wrapper)
    await wrapper.setProps({ open: false })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})
