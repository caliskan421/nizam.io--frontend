// Rota kaydı + kapı (`company_admin` olgusu; P1). Sayfa gövdesi taslakla değiştirilir (kapı
// gövdeden bağımsız sınanır; gövde `pages/ProgramsPage.test.ts`'te).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'

import { http, json, ORIGIN, requests, server } from './__tests__/harness'
import { PROGRAMS_ROUTE, programRoutes } from './routes'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))
vi.mock('./pages/ProgramsPage.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    default: defineComponent({
      name: 'ProgramsPage',
      setup: () => () => h('div', { 'data-page': 'programs' }),
    }),
  }
})

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

const mounted: VueWrapper[] = []
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  requests.length = 0
  server.resetHandlers()
  useToast().clear()
})

function standing(companyAdmin: boolean, rows: { department_id: string; role: string }[] = []) {
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
    http.get(`${ORIGIN}/v1/programs`, () => json({ programs: [{ program_id: 'p1', name: 'P' }] })),
  )
}

async function visit(lens: 'admin' | 'coordinator' = 'admin') {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens, departmentId: lens === 'admin' ? null : 'd1' })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: { render: () => null } }, ...programRoutes],
  })
  await router.push(PROGRAMS_ROUTE.path)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = mount(RouterView, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], router] },
  })
  mounted.push(wrapper)
  return { wrapper, router }
}

describe('program rotası', () => {
  it('katalog adı/yolu, S1', () => {
    expect(programRoutes.map((r) => [r.name, r.path, r.meta?.scope])).toEqual([
      ['program.programs', '/programlar', 'S1'],
    ])
  })

  it('yönetici girer (Koordinatör merceğinde de; mercek yetki değil)', async () => {
    standing(true, [{ department_id: 'd1', role: 'koordinator' }])
    const { wrapper, router } = await visit('coordinator')
    await vi.waitFor(() => expect(wrapper.find('[data-page="programs"]').exists()).toBe(true))
    expect(router.currentRoute.value.name).toBe('program.programs')
  })

  it('yönetici olmayan ana sayfaya döner; sayfa çizilmez', async () => {
    standing(false, [{ department_id: 'd1', role: 'koordinator' }])
    const { wrapper, router } = await visit('coordinator')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'))
    expect(wrapper.find('[data-page="programs"]').exists()).toBe(false)
    expect(useToast().queue.value).toHaveLength(1)
    expect(useToast().current.value?.message).toContain('erişim yetkiniz yok')
    await router.push(PROGRAMS_ROUTE.path)
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'))
    expect(useToast().queue.value).toHaveLength(1)
  })
})
