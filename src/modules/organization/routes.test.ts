import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'

import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'

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

// Rota kapısı sayfa GÖVDESİNDEN bağımsız sınanır (web-1 W41b dersi): dört sayfa hafif taslakla
// değiştirilir; gövde içeriği her O2b işçisinin kendi sayfa testindedir. Böylece gövdeler
// dolduruldukça bu dosya kırılmaz.
function pageStub(name: string) {
  return async () => {
    const { defineComponent, h } = await import('vue')
    return {
      default: defineComponent({ name, setup: () => () => h('div', { 'data-page': name }) }),
    }
  }
}
vi.mock('./pages/UsersPage.vue', pageStub('UsersPage'))
vi.mock('./pages/UserPage.vue', pageStub('UserPage'))
vi.mock('./pages/CoordinatorshipsPage.vue', pageStub('CoordinatorshipsPage'))
vi.mock('./pages/CoordinatorshipPage.vue', pageStub('CoordinatorshipPage'))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

const mounted: VueWrapper[] = []
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  requests.length = 0
  server.resetHandlers()
  useToast().clear()
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

/** Yol → rota kaydının yüklemesi gereken sayfa (taslak adı). */
const PAGES: [string, string][] = [
  ['/kullanicilar', 'UsersPage'],
  ['/kullanicilar/acc-2', 'UserPage'],
  ['/koordinatorlukler', 'CoordinatorshipsPage'],
  ['/koordinatorlukler/d9', 'CoordinatorshipPage'],
]
const PATHS = PAGES.map(([path]) => path)
const STANDING_PATHS = ['/v1/me', '/v1/me/departments', '/v1/programs']

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
  it.each(PAGES)('yönetici: %s → kapıdan geçer, %s sayfası çizilir', async (path, page) => {
    standing(true, [])
    const { wrapper, router } = await visit(path)
    await vi.waitFor(() => expect(wrapper.find(`[data-page="${page}"]`).exists()).toBe(true))
    expect(router.currentRoute.value.path).toBe(path)
    // Kapının kendi okuması yalnız standing'dir (sayfa taslağı istek atmaz).
    expect([...new Set(requests.map((r) => r.path))].sort()).toEqual(STANDING_PATHS)
  })

  it('Koordinatör merceğindeki yönetici de girer (mercek yetki değil)', async () => {
    standing(true, [{ department_id: 'd1', role: 'koordinator' }])
    const { wrapper, router } = await visit('/koordinatorlukler', 'coordinator')
    await vi.waitFor(() =>
      expect(wrapper.find('[data-page="CoordinatorshipsPage"]').exists()).toBe(true),
    )
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
      expect(wrapper.find('[data-page]').exists()).toBe(false)
      expect(useToast().queue.value).toHaveLength(1)
      expect(useToast().current.value?.message).toContain('erişim yetkiniz yok')
    }
  })

  it('geç standing yanıtı sökülmüş ve oturumu değişmiş kapıda bildirim üretmez', async () => {
    let release!: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    standing(false, [{ department_id: 'd1', role: 'uye' }])
    server.use(
      http.get(`${ORIGIN}/v1/me`, async () => {
        await pending
        return json({
          account_id: 'old',
          company_admin: false,
          email: 'old@example.test',
          full_name: 'Eski',
        })
      }),
    )
    const { router } = await visit('/kullanicilar', 'coordinator')
    await vi.waitFor(() => expect(requests.some((r) => r.path === '/v1/me')).toBe(true))
    useScopeStore().commit({ programId: 'p2', lens: 'member', departmentId: 'd2' })
    await router.push('/')
    authSession.clear()
    release()
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('home')
    expect(useToast().queue.value).toHaveLength(0)
  })

  it('standing gelmeden sayfa çizilmez, yönlendirme de olmaz', async () => {
    server.use(http.get(`${ORIGIN}/v1/me`, () => new Promise<never>(() => undefined)))
    standingPartial()
    const { wrapper, router } = await visit('/kullanicilar')
    await flushPromises()
    expect(wrapper.find('[data-page]').exists()).toBe(false)
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
