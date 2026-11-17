// Zil + panel entegrasyonu: gerçek yönlendirici, gerçek API istemcisi + MSW. Odak dönüşü her
// kapanış yolu için sınanır (KESİN 27): Esc, ✕ (dar ekran), dış tık, satır gezinmesi, rota değişimi.
import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  makeNotification,
  makeNotificationList,
  makeNotificationUnreadCount,
} from '@/shared/api/__tests__/defaults'
import { UNREAD_NOTIFICATIONS_KEY } from '@/modules/notifications/public'
import { authSession } from '@/shared/http'
import { settleQueries } from '@/shared/http/__tests__/settle'

import { createFakeLifecycle, mountWithScope, sideContext } from '../side/__tests__/fake-lifecycle'
import TopbarBell from './TopbarBell.vue'

const ORIGIN = 'http://localhost'
const server = setupServer(
  http.get(`${ORIGIN}/v1/notifications`, () =>
    HttpResponse.json(
      makeNotificationList({
        items: [
          makeNotification({
            id: 'n1',
            type: 'collaboration.meeting.created',
            subject_ref: { kind: 'meeting', id: 'm-9' },
            is_read: false,
            created_at: new Date().toISOString(),
          }),
          makeNotification({
            id: 'n2',
            type: 'organization.membership.assigned',
            subject_ref: { kind: 'membership', id: 'x' },
            is_read: true,
            created_at: new Date().toISOString(),
          }),
        ],
        unread_count: 1,
      }),
    ),
  ),
  http.post(`${ORIGIN}/v1/notifications/n1/read`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${ORIGIN}/v1/notifications/unread-count`, () =>
    HttpResponse.json(makeNotificationUnreadCount({ count: 1 })),
  ),
)
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  authSession.establish({
    token: 'tok-1',
    account_id: 'acc-1',
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    force_password_change: false,
  } as never)
})
afterEach(() => {
  server.resetHandlers()
  document.body.innerHTML = ''
  document.documentElement.className = ''
  vi.unstubAllGlobals()
})

async function mountBell(unread: number | null = 1, path = '/oturum') {
  const ctx = await sideContext(path)
  const { lifecycle } = createFakeLifecycle()
  if (unread !== null)
    ctx.queryClient.setQueryData([...UNREAD_NOTIFICATIONS_KEY], {
      count: unread,
      awaiting_count: 0,
    })
  const wrapper = mountWithScope(ctx, lifecycle, TopbarBell)
  await flushPromises()
  const bell = () => wrapper.get('[data-testid="topbar-bell"]')
  return { ctx, wrapper, bell }
}

function stubNarrow(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  )
}

describe('zil durumları (1a)', () => {
  it.each([
    [0, null, 'Bildirimler'],
    [1, '1', 'Bildirimler, 1 okunmamış'],
    [9, '9', 'Bildirimler, 9 okunmamış'],
    [10, '9+', 'Bildirimler, 9’dan fazla okunmamış'],
    [128, '9+', 'Bildirimler, 9’dan fazla okunmamış'],
  ])('sayaç %i → rozet %s, ad "%s"', async (count, badge, label) => {
    const { bell, wrapper } = await mountBell(count)
    expect(bell().attributes('aria-label')).toBe(label)
    const el = bell().find('.topbar-bell__badge')
    expect(el.exists()).toBe(badge !== null)
    if (badge !== null) expect(el.text()).toBe(badge)
    expect(wrapper.find('.topbar-bell__dot').exists()).toBe(false)
  })

  it('sayaç okunamadı (hata): rozet gizli, zil etkin, panel açılabilir', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/notifications/unread-count`, () =>
        HttpResponse.json(
          { code: 'platform.internal', message: 'x', request_id: 'r', fields: [] },
          { status: 400 },
        ),
      ),
    )
    const { bell, ctx } = await mountBell(null)
    await settleQueries(ctx.queryClient)
    expect(bell().find('.topbar-bell__badge').exists()).toBe(false)
    expect(bell().attributes('disabled')).toBeUndefined()
    expect(bell().attributes('aria-label')).toBe('Bildirimler')
  })

  it('sayı değişimi aria-live bölgesinde duyurulur; bilgi noktası/sessiz saat çizilmez', async () => {
    const { wrapper, ctx } = await mountBell(3)
    const live = wrapper.get('[data-testid="topbar-bell-live"]')
    expect(live.attributes('aria-live')).toBe('polite')
    expect(live.text()).toBe('3 okunmamış bildirim')
    ctx.queryClient.setQueryData([...UNREAD_NOTIFICATIONS_KEY], { count: 5, awaiting_count: 0 })
    await flushPromises()
    expect(live.text()).toBe('5 okunmamış bildirim')
    expect(wrapper.find('.topbar-bell__dot, .nb-mute').exists()).toBe(false)
  })
})

describe('panel açma/kapama ve odak dönüşü (KESİN 27)', () => {
  it('zil açıp kapatır: aria-expanded, aria-controls yalnız açıkken', async () => {
    const { bell, wrapper } = await mountBell()
    expect(bell().attributes('aria-controls')).toBeUndefined()
    await bell().trigger('click')
    expect(bell().attributes('aria-expanded')).toBe('true')
    expect(bell().attributes('aria-controls')).toBe('notification-panel')
    expect(wrapper.find('#notification-panel').exists()).toBe(true)
    await bell().trigger('click')
    expect(bell().attributes('aria-expanded')).toBe('false')
    expect(bell().attributes('aria-controls')).toBeUndefined()
    expect(wrapper.find('#notification-panel').exists()).toBe(false)
  })

  it('Esc kapatır ve odak zile döner', async () => {
    const { bell, wrapper, ctx } = await mountBell()
    await bell().trigger('click')
    await settleQueries(ctx.queryClient)
    expect(wrapper.get('#notification-panel').element.contains(document.activeElement)).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(bell().attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(bell().element)
  })

  it('dış tık kapatır; odak gövdeye düştüyse zile döner', async () => {
    const { bell, ctx } = await mountBell()
    await bell().trigger('click')
    await settleQueries(ctx.queryClient)
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(bell().attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(bell().element)
  })

  it('dış tıkta başka bir öğeye geçmiş odak çalınmaz', async () => {
    const { bell, ctx } = await mountBell()
    const other = document.createElement('button')
    document.body.append(other)
    await bell().trigger('click')
    await settleQueries(ctx.queryClient)
    other.focus()
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(document.activeElement).toBe(other)
  })

  it('satır tıklaması: hedefe gider, panel kapanır, odak zilde; okundu yazılır', async () => {
    const { bell, wrapper, ctx } = await mountBell()
    await bell().trigger('click')
    await settleQueries(ctx.queryClient)
    await wrapper.get('[data-testid="notification-row"] .nb-it__main').trigger('click')
    await settleQueries(ctx.queryClient)
    await vi.waitFor(() => expect(ctx.router.currentRoute.value.fullPath).toBe('/toplantilar/m-9'))
    expect(bell().attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(bell().element)
  })

  it('hedefi olmayan satır (membership): panel açık kalır, rota değişmez', async () => {
    const { bell, wrapper, ctx } = await mountBell()
    await bell().trigger('click')
    await settleQueries(ctx.queryClient)
    await wrapper.findAll('[data-testid="notification-row"] .nb-it__main')[1]!.trigger('click')
    expect(bell().attributes('aria-expanded')).toBe('true')
    expect(ctx.router.currentRoute.value.path).toBe('/oturum')
  })

  it('başka yoldan rota değişimi paneli kapatır', async () => {
    const { bell, ctx } = await mountBell()
    await bell().trigger('click')
    await ctx.router.push('/toplantilar')
    await flushPromises()
    expect(bell().attributes('aria-expanded')).toBe('false')
  })

  it('dar ekran (390): tam ekran modal, ✕ ile kapanır ve odak zile döner; kaydırma kilidi kalkar', async () => {
    stubNarrow(true)
    const { bell, wrapper, ctx } = await mountBell()
    await bell().trigger('click')
    await settleQueries(ctx.queryClient)
    expect(wrapper.get('#notification-panel').attributes('aria-modal')).toBe('true')
    expect(document.documentElement.classList.contains('rp-scroll-lock')).toBe(true)
    await wrapper.get('[data-testid="notification-close"]').trigger('click')
    await flushPromises()
    expect(bell().attributes('aria-expanded')).toBe('false')
    expect(document.documentElement.classList.contains('rp-scroll-lock')).toBe(false)
    expect(document.activeElement).toBe(bell().element)
  })

  it('dar ekran: Tab panelde döner (Shift+Tab sondan başa)', async () => {
    stubNarrow(true)
    const { bell, wrapper, ctx } = await mountBell()
    await bell().trigger('click')
    await settleQueries(ctx.queryClient)
    const panel = wrapper.get('#notification-panel')
    const focusable = [
      ...panel.element.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'),
    ]
    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!
    last.focus()
    await panel.trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(first)
    first.focus()
    await panel.trigger('keydown', { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })

  it('geniş ekran: Tab panelden çıkabilir (tuzak yok), aria-modal yok', async () => {
    stubNarrow(false)
    const { bell, wrapper, ctx } = await mountBell()
    await bell().trigger('click')
    await settleQueries(ctx.queryClient)
    const panel = wrapper.get('#notification-panel')
    expect(panel.attributes('aria-modal')).toBeUndefined()
    expect(document.documentElement.classList.contains('rp-scroll-lock')).toBe(false)
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    panel.element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('panel açıkken sökülürse kaydırma kilidi kalkar', async () => {
    stubNarrow(true)
    const { bell, wrapper, ctx } = await mountBell()
    await bell().trigger('click')
    await settleQueries(ctx.queryClient)
    expect(document.documentElement.classList.contains('rp-scroll-lock')).toBe(true)
    wrapper.unmount()
    expect(document.documentElement.classList.contains('rp-scroll-lock')).toBe(false)
  })

  it('kapsam (program) değişimi paneli kapatır', async () => {
    const { bell, ctx } = await mountBell()
    const { useScopeStore } = await import('@/shared/scope/store')
    useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
    await bell().trigger('click')
    await settleQueries(ctx.queryClient)
    useScopeStore().setProgram('p2')
    await flushPromises()
    expect(bell().attributes('aria-expanded')).toBe('false')
  })

  it('oturum/hesap değişimi (çıkış) paneli kapatır', async () => {
    const { bell, ctx } = await mountBell()
    await bell().trigger('click')
    await settleQueries(ctx.queryClient)
    authSession.clear()
    await flushPromises()
    expect(bell().attributes('aria-expanded')).toBe('false')
  })
})
