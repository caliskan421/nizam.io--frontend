// Kenar menüsü + GERÇEK kapsam yaşam döngüsü (MSW standing uçları): kabuğun yapacağı gibi
// `useScopeLifecycle()` bir kez kurulur ve `SCOPE_LIFECYCLE_KEY` ile sağlanır.
import { isCancelledError, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import { createMemoryHistory } from 'vue-router'

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
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
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
  const { createAppRouter } = await import('@/app/router')
  const router = createAppRouter(createMemoryHistory())
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

async function settle(scope: { status: { value: string } }, expected: string) {
  await vi.waitFor(() => expect(scope.status.value).toBe(expected))
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
    // kapalı gözlemcisi (rozet, F0'da devre dışı) sayılmaz.
    const oldScope = JSON.stringify(oldKey[1])
    const leftovers = queryClient
      .getQueryCache()
      .findAll({ predicate: (q) => m.scope.isScopedQueryKey(q.queryKey) })
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
