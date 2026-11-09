import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'

import { http, json, ORIGIN, requests, server } from './__tests__/harness'
import {
  coordinatorshipLocation,
  coordinatorshipsQueryAfterScopeChange,
  organizationRoutes,
  userLocation,
  usersPanelLocation,
  usersQueryAfterScopeChange,
} from './routes'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

const mounted: VueWrapper[] = []
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  requests.length = 0
  server.resetHandlers()
})

function standing(companyAdmin: boolean, rows: { department_id: string; role: string }[]) {
  server.use(
    http.get(`${ORIGIN}/v1/me`, () =>
      json({ account_id: 'me', company_admin: companyAdmin, email: 'k@x.test', full_name: 'Ben' }),
    ),
    http.get(`${ORIGIN}/v1/me/departments`, () =>
      json({
        departments: rows.map((r) => ({
          ...r,
          program_id: 'p1',
          program_name: 'Program',
          display_name: r.department_id,
        })),
      }),
    ),
    http.get(`${ORIGIN}/v1/programs`, () =>
      json({ programs: [{ program_id: 'p1', name: 'Program', year: 2026 }] }),
    ),
  )
}

async function visit(path: string, lens: 'admin' | 'coordinator' = 'admin') {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({
    programId: 'p1',
    lens,
    departmentId: lens === 'admin' ? null : 'd1',
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: { render: () => null } }, ...organizationRoutes],
  })
  await router.push(path)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = mount(RouterView, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], router] },
  })
  mounted.push(wrapper)
  return { wrapper, router }
}

const PATHS = [
  '/kullanicilar',
  '/kullanicilar/acc-2',
  '/koordinatorlukler',
  '/koordinatorlukler/d9',
]

describe('organizasyon rotaları — kayıt', () => {
  it('dört katalog rotası, kapsam sınıfları', () => {
    expect(organizationRoutes.map((r) => [r.name, r.path, r.meta?.scope])).toEqual([
      ['organization.users', '/kullanicilar', 'S1'],
      ['organization.user', '/kullanicilar/:accountId', 'S2'],
      ['organization.coordinatorships', '/koordinatorlukler', 'S2'],
      ['organization.coordinatorship', '/koordinatorlukler/:departmentId', 'S2'],
    ])
  })
})

describe('rota kapısı (company_admin olgusu; P1, P13, P16)', () => {
  it.each(PATHS)('yönetici: %s yer tutucu sayfayı çizer (boş, bozuk değil)', async (path) => {
    standing(true, [])
    const { wrapper, router } = await visit(path)
    await vi.waitFor(() => expect(wrapper.find('[data-skeleton-page]').exists()).toBe(true))
    expect(router.currentRoute.value.path).toBe(path)
    expect(wrapper.find('h1').exists()).toBe(true)
    // Yer tutucu sayfa veri isteği atmaz (yalnız standing okumaları).
    expect(requests.map((r) => r.path).sort()).toEqual([
      '/v1/me',
      '/v1/me/departments',
      '/v1/programs',
    ])
  })

  it('Koordinatör merceğindeki yönetici de girer (mercek yetki değil)', async () => {
    standing(true, [{ department_id: 'd1', role: 'koordinator' }])
    const { wrapper, router } = await visit('/koordinatorlukler', 'coordinator')
    await vi.waitFor(() => expect(wrapper.find('[data-skeleton-page]').exists()).toBe(true))
    expect(router.currentRoute.value.name).toBe('organization.coordinatorships')
  })

  it.each([
    ['koordinatör', [{ department_id: 'd1', role: 'koordinator' }]],
    ['üye', [{ department_id: 'd1', role: 'uye' }]],
  ])('%s: doğrudan URL ana sayfaya döner, sayfa çizilmez', async (_label, rows) => {
    standing(false, rows)
    for (const path of PATHS) {
      const { wrapper, router } = await visit(path, 'coordinator')
      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'))
      expect(wrapper.find('[data-skeleton-page]').exists()).toBe(false)
    }
  })

  it('standing gelmeden sayfa çizilmez, yönlendirme de olmaz', async () => {
    server.use(http.get(`${ORIGIN}/v1/me`, () => new Promise<never>(() => undefined)))
    standingPartial()
    const { wrapper, router } = await visit('/kullanicilar')
    await flushPromises()
    expect(wrapper.find('[data-skeleton-page]').exists()).toBe(false)
    expect(router.currentRoute.value.path).toBe('/kullanicilar')
  })
})

function standingPartial() {
  server.use(
    http.get(`${ORIGIN}/v1/me/departments`, () => json({ departments: [] })),
    http.get(`${ORIGIN}/v1/programs`, () => json({ programs: [] })),
  )
}

describe('URL davranışı', () => {
  it('05 kapsam değişimi: arama ve rol korunur; koordinatörlük, secili, bilinmeyen düşer', () => {
    expect(
      usersQueryAfterScopeChange({ q: 'ali', rol: 'uye', koordinatorluk: 'd1', secili: 'a', x: 1 }),
    ).toEqual({ q: 'ali', rol: 'uye' })
  })

  it('08 kapsam değişimi: arama ve görünüm korunur, sıralama varsayılana döner', () => {
    expect(
      coordinatorshipsQueryAfterScopeChange({ q: 'şasi', gorunum: 'liste', sirala: 'ad:azalan' }),
    ).toEqual({ q: 'şasi', gorunum: 'liste' })
  })

  it('bağlantılar: yan panel (E-05-45), 05b (E-05-16), 08b sekmesi (E-08-34)', () => {
    expect(usersPanelLocation('a1')).toEqual({
      name: 'organization.users',
      query: { secili: 'a1' },
    })
    expect(userLocation('a1', { kart: 'acik' })).toEqual({
      name: 'organization.user',
      params: { accountId: 'a1' },
      query: { kart: 'acik' },
    })
    expect(coordinatorshipLocation('d1', 'uyeler').query).toEqual({ sekme: 'uyeler' })
    expect(coordinatorshipLocation('d1').query).toEqual({})
  })
})
