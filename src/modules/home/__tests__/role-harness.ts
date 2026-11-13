// K1/Ü1 testleri: harness'in üstüne rol sayfalarının okuma uçları (liste, toplantı, ekip, talep,
// bildirim sayacı) ve ek rota kayıtları. Ağ yalnız MSW (gerçek istemci).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'
import type { ScopeSelection } from '@/shared/scope/resolve'

import { COUNTS, http, json, LIST, ORIGIN, row, settle } from './harness'

export { row }

export const EMPTY_BY = {
  baslanmadi: 0,
  devam_ediyor: 0,
  onaya_sunuldu: 0,
  iade_edildi: 0,
  tamamlandi: 0,
}

/** Sayaç + liste + yardımcı okumalar için varsayılan boş yanıtlar; `over` ile ezilir. */
export function roleHandlers(
  over: {
    items?: ReturnType<typeof row>[]
    counts?: Record<string, unknown>
    meetings?: unknown[]
    members?: unknown[]
    requests?: unknown[]
    unread?: number
  } = {},
) {
  const items = over.items ?? []
  return [
    http.get(`${ORIGIN}${COUNTS}`, () =>
      json({
        total: items.length,
        by_status: EMPTY_BY,
        overdue: 0,
        pending_date_requests: 0,
        ...over.counts,
      }),
    ),
    http.get(`${ORIGIN}${LIST}`, () => json({ items, next_cursor: '' })),
    http.get(`${ORIGIN}/v1/meetings`, () => json({ items: over.meetings ?? [], next_cursor: '' })),
    http.get(`${ORIGIN}/v1/departments/:id/members`, () => json({ members: over.members ?? [] })),
    http.get(`${ORIGIN}/v1/date-change-requests/mine`, () =>
      json({ requests: over.requests ?? [], total: (over.requests ?? []).length }),
    ),
    http.get(`${ORIGIN}/v1/notifications/unread-count`, () => json({ count: over.unread ?? 0 })),
  ]
}

const clients: QueryClient[] = []

/** `mountWith` gibi; rota tablosu rol sayfalarının hedeflerini de içerir. */
export async function mountRole(component: Component, selection: ScopeSelection) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit(selection)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  })
  const empty = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: empty },
      { path: '/gorevler', name: 'work.tasks', component: empty },
      { path: '/zaman-cizelgesi', name: 'work.timeline', component: empty },
      { path: '/toplantilar', component: empty },
      { path: '/toplantilar/:id', component: empty },
    ],
  })
  await router.push('/')
  const wrapper = mount(component, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], router] },
    attachTo: document.body,
  })
  clients.push(queryClient)
  await settle()
  return { wrapper, router, store, queryClient }
}
