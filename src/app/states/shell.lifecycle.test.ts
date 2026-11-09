// Kabuk + açık durumlar, GERÇEK uygulama kökü (App.vue), GERÇEK üretim router'ı
// (`createAppRouter`; 01 ana sayfa modül sayfası dahil) ve GERÇEK kapsam yaşam döngüsüyle, sahte
// backend (MSW) karşısında: her K7 tetikleyicisi ve çıkış hatası (ortak-kurallar §8).
import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

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
// Isınma: bir kez tam açılış (App + üretim router'ı + tembel sayfalar + kabuk). Soğuk dönüşüm
// maliyeti ilk testin 5 sn sınırına yüklenmez (tam koşuda zaman aşımı titremesi, Codex Ö-03);
// modüller her testte `freshModules` ile yeniden değerlendirilir, dönüşüm önbelleği kalır.
beforeAll(async () => {
  const { wrapper } = await bootApp({ companyAdmin: false, rows: [], programs: [] }, '/oturum')
  wrapper.unmount()
  backend.server.resetHandlers()
  backend.reset()
  document.body.innerHTML = ''
}, 30_000)
afterEach(() => {
  backend.server.resetHandlers()
  backend.reset()
  document.body.innerHTML = ''
})
afterAll(() => backend.server.close())

const unread = http.get('http://localhost/v1/notifications/unread-count', () =>
  HttpResponse.json({ count: 0 }),
)
// 01 ana sayfanın kapsamlı okumaları (Admin: pano; K/Ü: görev listesi) — boş yanıt.
const homeData = [
  http.get('http://localhost/v1/reports/dashboard', () =>
    HttpResponse.json({
      total_tasks: 0,
      completed_tasks: 0,
      active_tasks: 0,
      overdue_tasks: 0,
      pending_approvals: 0,
    }),
  ),
  http.get('http://localhost/v1/program/work-items', () => HttpResponse.json({ items: [] })),
]

async function bootApp(fixture: StandingFixture, path = '/') {
  backend.server.use(...standingHandlers(backend, fixture), unread, ...homeData)
  const m = await freshModules()
  const { default: App } = await import('@/app/App.vue')
  const { createAppRouter } = await import('@/app/router')
  const { i18n } = await import('@/shared/i18n')
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  const queryClient = newQueryClient()
  const wrapper = mount(App, {
    global: { plugins: [m.pinia, [VueQueryPlugin, { queryClient }], router, i18n] },
    attachTo: document.body,
  })
  await vi.waitFor(() => expect(wrapper.find('[data-testid="app-shell"]').exists()).toBe(true))
  await flushPromises()
  return { m, wrapper, router }
}

const departmentRequests = () =>
  backend.state.requests.filter((r) => r.path === '/v1/program/departments')

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

  it('kapsam hazır → `/` kabuk içinde 01 ana sayfa (yönlendirme yok)', async () => {
    const { wrapper, router } = await bootApp({
      companyAdmin: false,
      rows: [row('p1', 'd1', 'uye')],
      programs: [{ program_id: 'p1', name: 'Bir' }],
    })
    await vi.waitFor(() => expect(wrapper.find('[data-testid="home-page"]').exists()).toBe(true))
    expect(router.currentRoute.value.name).toBe('home')
    expect(wrapper.find('[data-testid="shell-state"]').exists()).toBe(false)
    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="home-page"]').text()).toContain('Merhaba Deneme Kişi'),
    )
    expect(crumbText(wrapper)).toMatch(/Bir\s*\/\s*Ana sayfa/)
  })

  it('yönetici + programa bağlı departman yok → "departman yok" (yalnız içerik; menü açık)', async () => {
    const { wrapper } = await bootApp({
      companyAdmin: true,
      rows: [],
      programs: [{ program_id: 'p1', name: 'Bir' }],
      programDepartments: { p1: [] },
    })
    const state = await openState(wrapper, 'state.no-department')
    expect(state.text()).toContain('Bu programa henüz departman katılmadı.')
    const button = state.get('button')
    expect(button.text()).toBe('Departman ekle')
    expect(button.attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="home-page"]').exists()).toBe(false)
    expect(wrapper.find('aside.rp-side').exists()).toBe(true)
    expect(crumbText(wrapper)).toMatch(/^Bir\s*\/\s*Programa departman katılmamış$/)
    const [request] = departmentRequests()
    expect(request?.headers.get('X-Nizamio-Program')).toBe('p1')
  })

  it('yönetici + bağlı departman var → ana sayfa; açık durum yok', async () => {
    const { wrapper } = await bootApp({
      companyAdmin: true,
      rows: [],
      programs: [{ program_id: 'p1', name: 'Bir' }],
      programDepartments: { p1: ['d1'] },
    })
    await vi.waitFor(() => expect(wrapper.find('[data-testid="home-page"]').exists()).toBe(true))
    expect(wrapper.find('[data-testid="shell-state"]').exists()).toBe(false)
    expect(departmentRequests()).toHaveLength(1)
  })

  it('koordinatör merceği departman listesi sormaz, "departman yok"a düşmez', async () => {
    const { wrapper } = await bootApp({
      companyAdmin: false,
      rows: [row('p1', 'd1', 'koordinator')],
      programs: [{ program_id: 'p1', name: 'Bir' }],
      programDepartments: { p1: [] },
    })
    await vi.waitFor(() => expect(wrapper.find('[data-testid="home-page"]').exists()).toBe(true))
    expect(wrapper.find('[data-open-state="state.no-department"]').exists()).toBe(false)
    expect(departmentRequests()).toHaveLength(0)
  })

  it('çıkış hatası → kabuk kalkar, giriş ekranında "sunucu çıkışı doğrulanamadı"; refresh yok', async () => {
    backend.server.use(
      http.post('http://localhost/v1/auth/logout', () =>
        backend.envelope('platform.internal', 500),
      ),
    )
    const { wrapper, router } = await bootApp({
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
    // `/` oturum açık değilken içerik göstermez; kimlik sayfasına (S0) yönlenir.
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('identity.session'))
    await vi.waitFor(() => expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true))
    expect(wrapper.find('[data-testid="home-page"]').exists()).toBe(false)
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
