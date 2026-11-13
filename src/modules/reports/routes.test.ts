// Rota kaydı + kapı. Sayfa gövdeleri taslakla değiştirilir (KESİN 22): rota/kapı sözleşmesi
// gövdeden bağımsızdır; gövde dolunca bu test kırılmaz.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'

import { harness, server, standing, resetHarness } from './__tests__/harness'
import { REPORT_MEETING_ROUTE, REPORT_SEASON_ROUTE, reportsRoutes } from './routes'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))
vi.mock('./pages/SeasonReportPage.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return { default: defineComponent({ setup: () => () => h('div', { 'data-page': 'season' }) }) }
})
vi.mock('./pages/MeetingReportPage.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return { default: defineComponent({ setup: () => () => h('div', { 'data-page': 'meeting' }) }) }
})

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
const mounted: VueWrapper[] = []
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  resetHarness()
  useToast().clear()
})

async function visit(path: string, lens: 'admin' | 'coordinator' = 'admin') {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens, departmentId: lens === 'admin' ? null : 'd1' })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: { render: () => null } }, ...reportsRoutes],
  })
  await router.push(path)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = mount(RouterView, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], router] },
  })
  mounted.push(wrapper)
  return { wrapper, router }
}

describe('rapor rotaları', () => {
  it('iki S2 rota kayıtlı (ad, yol, kapsam); bileşenler tembel yüklenir', () => {
    expect(reportsRoutes.map(({ name, path, meta }) => ({ name, path, meta }))).toEqual([
      { ...REPORT_SEASON_ROUTE, meta: { scope: 'S2' } },
      { ...REPORT_MEETING_ROUTE, meta: { scope: 'S2' } },
    ])
    expect(reportsRoutes.every((route) => typeof route.component === 'function')).toBe(true)
  })

  it('yönetici girer (Koordinatör merceğinde de; mercek yetki değil)', async () => {
    server.use(...standing({ admin: true, rows: [['p1', 'd1', 'koordinator']] }))
    const { wrapper, router } = await visit('/arsiv/donem-raporu', 'coordinator')
    await vi.waitFor(() => expect(wrapper.find('[data-page="season"]').exists()).toBe(true))
    expect(router.currentRoute.value.name).toBe('reports.season')
    await router.push('/toplantilar/m1/rapor')
    await vi.waitFor(() => expect(wrapper.find('[data-page="meeting"]').exists()).toBe(true))
    expect(router.currentRoute.value.params.meetingId).toBe('m1')
  })

  it.each(['koordinator', 'uye'])('%s ana sayfaya döner; sayfa çizilmez', async (role) => {
    server.use(...standing({ rows: [['p1', 'd1', role]] }))
    const { wrapper, router } = await visit('/toplantilar/m1/rapor', 'coordinator')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'))
    expect(wrapper.find('[data-page]').exists()).toBe(false)
    expect(useToast().current.value?.message).toContain('erişim yetkiniz yok')
  })

  it('standing gelene dek hiçbir şey çizilmez ve yönlendirilmez', async () => {
    const { wrapper, router } = await visit('/arsiv/donem-raporu')
    harness({ programId: 'p1', lens: 'admin', departmentId: null })
    expect(wrapper.find('[data-page]').exists()).toBe(false)
    expect(router.currentRoute.value.name).toBe('reports.season')
  })
})
