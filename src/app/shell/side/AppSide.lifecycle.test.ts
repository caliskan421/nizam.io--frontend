// Kenar menüsü + GERÇEK kapsam yaşam döngüsü (MSW standing uçları): kabuğun yapacağı gibi
// `useScopeLifecycle()` bir kez kurulur ve `SCOPE_LIFECYCLE_KEY` ile sağlanır.
import { isCancelledError, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { defineComponent, h, provide, watch, type Ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { until } from '@/shared/http/__tests__/settle'
import { isScopedQueryKey } from '@/shared/http/query-keys'
import {
  createTarget,
  freshModules,
  newQueryClient,
  row,
  standingHandlers,
  type StandingFixture,
} from '@/shared/scope/__tests__/harness'

import { createFakeBackend } from '../../../../tests/support/fake-backend'

const backend = createFakeBackend()
beforeAll(async () => {
  backend.server.listen({ onUnhandledFrame: 'error' })
  // Isınma: SFC ve standing modüllerinin dönüşümü bir kez yapılır; test başına
  // `vi.resetModules()` sonrası yalnız yeniden değerlendirme kalır.
  await import('./AppSide.vue')
  await import('@/shared/scope/lifecycle')
})
afterEach(() => {
  backend.server.resetHandlers()
  backend.reset()
  document.body.innerHTML = ''
})
afterAll(() => backend.server.close())

async function boot(fixture: StandingFixture, remembered: { lens?: 'admin' } = {}) {
  backend.server.use(...standingHandlers(backend, fixture))
  const m = await freshModules()
  if (remembered.lens) m.preferences.preferences.write('scope.lens', remembered.lens)
  // Taze modül grafiğiyle (aynı oturum/istemci nesneleri) bileşen ve anahtar.
  const { default: AppSide } = await import('./AppSide.vue')
  const { SCOPE_LIFECYCLE_KEY } = await import('./scope-key')
  // Yalnız menünün bağlandığı rotalar (tam katalog router'ı burada gereksiz yük).
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { render: () => null } },
      { path: '/oturum', name: 'identity.session', component: { render: () => null } },
      // F1: Görevler menü öğesi canlı (bağlantı rota adını çözer).
      { path: '/gorevler', name: 'work.tasks', component: { render: () => null } },
      // F2 (W71): yönetici menüsündeki Yönetim öğeleri.
      { path: '/kullanicilar', name: 'organization.users', component: { render: () => null } },
      {
        path: '/koordinatorlukler',
        name: 'organization.coordinatorships',
        component: { render: () => null },
      },
      // F2 (W81): "Teknofest ve sezon".
      { path: '/programlar', name: 'program.programs', component: { render: () => null } },
    ],
  })
  await router.push('/oturum')
  const queryClient = newQueryClient()
  const target = createTarget()
  let lifecycle: ReturnType<typeof m.lifecycle.useScopeLifecycle> | undefined
  const Host = defineComponent({
    setup() {
      lifecycle = m.lifecycle.useScopeLifecycle(target)
      provide(SCOPE_LIFECYCLE_KEY, lifecycle)
      return () => h(AppSide, { collapsed: false })
    },
  })
  const wrapper = mount(Host, {
    global: { plugins: [m.pinia, [VueQueryPlugin, { queryClient }], router] },
    attachTo: document.body,
  })
  return { m, wrapper, queryClient, scope: lifecycle!, store: m.store.useScopeStore() }
}

/** Olay tabanlı: kapsam durumu `expected` olana dek (durum izleyicisi; süre/yoklama yok). */
async function settle(scope: { status: Readonly<Ref<string>> }, expected: string) {
  await until(
    () => scope.status.value === expected,
    (notify) => watch(scope.status, notify, { flush: 'sync' }),
  )
  await flushPromises()
}

describe('AppSide + kapsam yaşam döngüsü', () => {
  it('çok program + hatırlanan yok → program seçicisi açık; seçimle kapsam kurulur', async () => {
    const { wrapper, scope, store } = await boot({
      companyAdmin: true,
      rows: [],
      programs: [
        { program_id: 'p1', name: 'Bir', year: 2026 },
        { program_id: 'p2', name: 'İki' },
      ],
    })
    await settle(scope, 'selecting')
    const menu = wrapper.get('[role="menu"]')
    expect(menu.attributes('aria-label')).toBe('Program seç')
    expect(menu.findAll('[role="menuitemradio"]').map((i) => i.attributes('aria-checked'))).toEqual(
      ['false', 'false'],
    )
    await menu.findAll('[role="menuitemradio"]')[1]!.trigger('click')
    await settle(scope, 'ready')
    expect(store.snapshot).toEqual({ programId: 'p2', lens: 'admin', departmentId: null })
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('mercek değişimi: kapsamlı sorgular iptal + düşer; company_admin korunur (P1)', async () => {
    const { wrapper, scope, store, queryClient, m } = await boot(
      {
        companyAdmin: true,
        rows: [row('p1', 'd1', 'koordinator')],
        programs: [{ program_id: 'p1', name: 'Bir' }],
      },
      { lens: 'admin' },
    )
    await settle(scope, 'ready')
    expect(store.lens).toBe('admin')
    const oldKey = m.scope.scopedKey(store.snapshot, 'work-items')
    queryClient.setQueryData(oldKey, ['eski veri'])
    const inflight = queryClient
      .fetchQuery({
        queryKey: m.scope.scopedKey(store.snapshot, 'gantt'),
        queryFn: () => new Promise<never>(() => undefined),
      })
      .then(
        () => 'tamamlandı',
        (error: unknown) => error,
      )

    await wrapper.get('[aria-label="Rol: Admin"]').trigger('click')
    const rows = wrapper.get('[aria-label="Rol seç"]').findAll('[role="menuitemradio"]')
    await rows.find((r) => r.text().startsWith('Koordinatör'))!.trigger('click')
    await settle(scope, 'ready')

    expect(store.snapshot).toEqual({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    expect(queryClient.getQueryData(oldKey)).toBeUndefined()
    // Eski kapsamın (Admin merceği) hiçbir sorgusu kalmaz; yeni kapsamın veri taşımayan
    // kapalı gözlemcisi (rozet; K/Ü merceğinde uç çağrılmaz, BE-003) sayılmaz.
    const oldScope = JSON.stringify(oldKey[1])
    const leftovers = queryClient
      .getQueryCache()
      .findAll({ predicate: (q) => isScopedQueryKey(q.queryKey) })
    expect(leftovers.filter((q) => JSON.stringify(q.queryKey[1]) === oldScope)).toEqual([])
    expect(leftovers.every((q) => q.state.data === undefined)).toBe(true)
    expect(isCancelledError(await inflight)).toBe(true)
    expect(scope.facts.value.companyAdmin).toBe(true)
    // Tek birim → otomatik; kart görünür, rol çerçevesi Koordinatör.
    expect(wrapper.find('[aria-label="Koordinatörlük: Birim d1"]').exists()).toBe(true)
    expect(wrapper.get('[aria-label="Rol: Koordinatör"]').classes()).toContain(
      'side-card--coordinator',
    )
  })
})
