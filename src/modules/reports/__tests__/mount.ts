// Rapor bileşen testleri için ortak bağlama: Pinia (kapsam kayıtlı), TanStack Query, i18n, router
// (rapor rotaları + sahte ana sayfa) ve gerçek `useStanding` (msw). `attachTo` gövdeye bağlıdır:
// odak/ARIA testleri gerçek DOM odağına bakar (KESİN 27).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18n } from '@/shared/i18n'
import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'

import { reportsRoutes } from '../routes'

export const mounted: VueWrapper[] = []

export function unmountAll(): void {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
}

export const ADMIN_SCOPE: ScopeSelection = { programId: 'p1', lens: 'admin', departmentId: null }

export async function mountWith(
  component: Component,
  options: {
    props?: Record<string, unknown>
    slots?: Record<string, string>
    scope?: ScopeSelection
    path?: string
  } = {},
) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit(options.scope ?? ADMIN_SCOPE)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { render: () => null } },
      { path: '/arsiv', name: 'archive.folders', component: { render: () => null } },
      {
        path: '/toplantilar/:meetingId',
        name: 'collaboration.meeting',
        component: { render: () => null },
      },
      { path: '/toplantilar', name: 'collaboration.meetings', component: { render: () => null } },
      ...reportsRoutes,
    ],
  })
  await router.push(options.path ?? '/')
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retryDelay: 0, retry: false }, mutations: { retry: false } },
  })
  const host = document.createElement('div')
  document.body.append(host)
  const wrapper = mount(component, {
    props: options.props as never,
    slots: options.slots,
    attachTo: host,
    global: { plugins: [pinia, i18n, router, [VueQueryPlugin, { queryClient }]] },
  })
  mounted.push(wrapper)
  return { wrapper, router, queryClient }
}
