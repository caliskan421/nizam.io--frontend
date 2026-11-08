// Kabuk + açık durumlar, GERÇEK uygulama kökü (App.vue) ve GERÇEK kapsam yaşam döngüsüyle,
// sahte backend (MSW) karşısında: her K7 tetikleyicisi ve çıkış hatası (ortak-kurallar §8).
import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import {
  freshModules,
  newQueryClient,
  row,
  standingHandlers,
  type StandingFixture,
} from '@/shared/scope/__tests__/harness'

import { createFakeBackend } from '../../../tests/support/fake-backend'

const backend = createFakeBackend()
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  backend.server.resetHandlers()
  backend.reset()
  document.body.innerHTML = ''
})
afterAll(() => backend.server.close())

const unread = http.get('http://localhost/v1/notifications/unread-count', () =>
  HttpResponse.json({ count: 0 }),
)

// F0'da ana sayfa içeriği (01, S1) yok ve `/` oturum sayfasına (S0) yönlenir; açık durumlar S1+
// rotada görünür. Ana sayfa, F1'de bağlanacağı gibi katalog adıyla bir yer tutucu bileşene bağlanır.
const HomeStub = defineComponent({ render: () => h('p', { 'data-testid': 'home-page' }) })

async function bootApp(fixture: StandingFixture, path = '/') {
  backend.server.use(...standingHandlers(backend, fixture), unread)
  const m = await freshModules()
  const { default: App } = await import('@/app/App.vue')
  const { buildRoutes, MODULE_ROUTES } = await import('@/app/router')
  const { i18n } = await import('@/shared/i18n')
  const routes = buildRoutes('F0', [
    ...MODULE_ROUTES,
    { path: '/', name: 'home', component: HomeStub },
  ])
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  const queryClient = newQueryClient()
  const wrapper = mount(App, {
    global: { plugins: [m.pinia, [VueQueryPlugin, { queryClient }], router, i18n] },
    attachTo: document.body,
  })
  await vi.waitFor(() => expect(wrapper.find('[data-testid="app-shell"]').exists()).toBe(true))
  await flushPromises()
  return { m, wrapper }
}

async function openState(wrapper: Awaited<ReturnType<typeof bootApp>>['wrapper'], name: string) {
  await vi.waitFor(() => expect(wrapper.find(`[data-open-state="${name}"]`).exists()).toBe(true))
  return wrapper.get(`[data-open-state="${name}"]`)
}

const crumbText = (wrapper: Awaited<ReturnType<typeof bootApp>>['wrapper']) =>
  wrapper.get('[data-testid="topbar-crumbs"]').text()

describe('kabuk açık durumları (sahte backend)', () => {
  it('listPrograms 403 membership_required → "departman ataması bekleniyor", kart yok', async () => {
    const { wrapper } = await bootApp({
      companyAdmin: false,
      rows: [],
      programs: 'membership_required',
    })
    const state = await openState(wrapper, 'state.membership-pending')
    expect(state.find('button').exists()).toBe(false)
    expect(wrapper.find('[data-testid="home-page"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label^="Program:"]').exists()).toBe(false)
    expect(crumbText(wrapper)).toBe('Departman ataması bekleniyor')
  })

  it('yönetici + program yok → "program oluştur" devre dışı (F2)', async () => {
    const { wrapper } = await bootApp({ companyAdmin: true, rows: [], programs: [] })
    const state = await openState(wrapper, 'state.no-program')
    const button = state.get('button')
    expect(button.text()).toBe('Program oluştur')
    expect(button.attributes('disabled')).toBeDefined()
    expect(state.text()).toContain('F2’de açılacak')
  })

  it('yönetici olmayan + program yok → bilgilendirme, eylem yok', async () => {
    const { wrapper } = await bootApp({ companyAdmin: false, rows: [], programs: [] })
    const state = await openState(wrapper, 'state.no-program')
    expect(state.find('button').exists()).toBe(false)
  })

  it('açık durum S0 oturum sayfasını örtmez (kurulum provası: ilk programdan önce giriş)', async () => {
    const { wrapper } = await bootApp({ companyAdmin: true, rows: [], programs: [] }, '/oturum')
    await vi.waitFor(() => expect(crumbText(wrapper)).toBe('Oturum'))
    expect(wrapper.find('[data-testid="session-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="shell-state"]').exists()).toBe(false)
  })

  it('kapsam hazır → rota içeriği; konum izi program adıyla, readProgram yok', async () => {
    const { wrapper } = await bootApp(
      {
        companyAdmin: false,
        rows: [row('p1', 'd1', 'koordinator')],
        programs: [{ program_id: 'p1', name: 'Şanlıurfa Teknofest' }],
      },
      '/oturum',
    )
    await vi.waitFor(() => expect(crumbText(wrapper)).toContain('Şanlıurfa Teknofest'))
    expect(wrapper.find('[data-testid="shell-state"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="session-page"]').exists()).toBe(true)
    expect(crumbText(wrapper)).toMatch(/Şanlıurfa Teknofest\s*\/\s*Oturum/)
    expect(backend.state.requests.some((r) => /^\/v1\/programs\/./.test(r.path))).toBe(false)
  })

  it('çıkış hatası → kabuk kalkar, giriş ekranında "sunucu çıkışı doğrulanamadı"; refresh yok', async () => {
    backend.server.use(
      http.post('http://localhost/v1/auth/logout', () =>
        backend.envelope('platform.internal', 500),
      ),
    )
    const { wrapper } = await bootApp({
      companyAdmin: true,
      rows: [],
      programs: [{ program_id: 'p1', name: 'Bir' }],
    })
    const refreshBefore = backend.count('/v1/auth/refresh')
    await wrapper.get('button[aria-label="Çıkış yap"]').trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="logout-unverified"]').exists()).toBe(true),
    )
    expect(wrapper.find('[data-testid="app-shell"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="logout-unverified"]').text()).toContain(
      'Bu cihazdaki oturum kapatıldı, sunucu doğrulaması alınamadı.',
    )
    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true)
    expect(backend.count('/v1/auth/refresh')).toBe(refreshBefore)
  })

  it('doğrulanan çıkış → uyarı yok', async () => {
    const { wrapper } = await bootApp({
      companyAdmin: true,
      rows: [],
      programs: [{ program_id: 'p1', name: 'Bir' }],
    })
    await wrapper.get('button[aria-label="Çıkış yap"]').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[data-testid="app-shell"]').exists()).toBe(false))
    await flushPromises()
    expect(wrapper.find('[data-testid="logout-unverified"]').exists()).toBe(false)
  })
})
