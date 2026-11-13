// K1/Ü1 testleri: harness'in üstüne rol sayfalarının okuma uçları (liste, toplantı, ekip, talep,
// bildirim sayacı) ve ek rota kayıtları. Ağ yalnız MSW (gerçek istemci).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { vi } from 'vitest'

import { useScopeStore } from '@/shared/scope/store'
import type { ScopeSelection } from '@/shared/scope/resolve'

import { settleQueries } from '@/shared/http/__tests__/settle'

import { COUNTS, http, json, LIST, ORIGIN, resetAll, row } from './harness'

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

const mounted: VueWrapper[] = []

/** Her testin sonunda: rol sayfası sökülür, harness sıfırlanır. */
export function resetRole(): void {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  resetAll()
}

/** `mountWith` gibi; rota tablosu rol sayfalarının hedeflerini de içerir. */
export async function mountRole(
  component: Component,
  selection: ScopeSelection,
  props: Record<string, unknown> = {},
) {
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
    props,
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], router] },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  await settleQueries([queryClient])
  return { wrapper, router, store, queryClient }
}

/**
 * Tarayıcıda `structuredClone(File)` yine `File`; jsdom'da değil. Yazma motoru gövdeyi
 * dondururken tarayıcı davranışı korunur (work/archive yükleme testleriyle aynı).
 */
export function stubBrowserClone(): void {
  const nativeClone = globalThis.structuredClone
  const clone = (value: unknown): unknown => {
    if (value instanceof Blob) return value
    if (Array.isArray(value)) return value.map(clone)
    if (
      value !== null &&
      typeof value === 'object' &&
      Object.getPrototypeOf(value) === Object.prototype
    ) {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)]))
    }
    return nativeClone(value)
  }
  vi.stubGlobal('structuredClone', clone)
}
