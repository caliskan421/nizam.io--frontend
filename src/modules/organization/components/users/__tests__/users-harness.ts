// 05 Kullanıcılar bileşen/sayfa testleri: GERÇEK API istemcisi + MSW (organizasyon harness'ının
// sunucusu ve istek kaydı), gerçek Pinia kapsam deposu, TanStack Query ve bellek router'ı.
// Oturum deposu test dosyasında `vi.mock` ile taklit edilir (standing okunsun diye).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, type Component } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'
import { ConfirmHost } from '@/shared/ui/confirm'

import { http, json, knownUser, ORIGIN } from '../../../__tests__/harness'

export const DEPARTMENTS = [
  { department_id: 'd1', display_name: 'Mekanik', code: 'MEK' },
  { department_id: 'd2', display_name: 'İdari işler' },
  { department_id: 'd3', display_name: 'Fuar' },
]

export const USERS_URL = `${ORIGIN}/v1/admin/users`

/** Rol dizeleri test verisidir (K1 lint test dosyalarında kapalı). */
export const USERS = [
  knownUser('u1', 'Ayşe Demir', ['p1:d1:koordinator', 'p1:d2:uye']),
  knownUser('u2', 'Berk Kaya', ['p1:d2:uye', 'p2:d9:koordinator']),
  knownUser('u3', 'Cem Tan', ['p2:d1:uye']),
]

export interface StandingFixture {
  accountId: string
  companyAdmin: boolean
  rows: { department_id: string; role: string }[]
}

export const ADMIN_ME: StandingFixture = { accountId: 'me', companyAdmin: true, rows: [] }

/** Standing (S1) + programlar + program departmanları (S2). */
export function baseHandlers(fixture: StandingFixture = ADMIN_ME) {
  return [
    http.get(`${ORIGIN}/v1/me`, () =>
      json({
        account_id: fixture.accountId,
        company_admin: fixture.companyAdmin,
        email: 'kisi@example.test',
        full_name: 'Deneme Kişi',
      }),
    ),
    http.get(`${ORIGIN}/v1/me/departments`, () =>
      json({
        departments: fixture.rows.map((r) => ({
          ...r,
          program_id: 'p1',
          program_name: 'Program Bir',
          display_name: DEPARTMENTS.find((d) => d.department_id === r.department_id)!.display_name,
        })),
      }),
    ),
    http.get(`${ORIGIN}/v1/programs`, () =>
      json({ programs: [{ program_id: 'p1', name: 'Program Bir', year: 2026 }] }),
    ),
    http.get(`${ORIGIN}/v1/program/departments`, () => json({ departments: DEPARTMENTS })),
    http.get(`${ORIGIN}/v1/program/work-items`, () => json({ items: [] })),
  ]
}

/** `listUsers`: imleçsiz istek `first` (+ `next_cursor`), imleçli istek `next`. */
export function usersHandler(first = USERS, nextCursor?: string, next: typeof USERS = []) {
  return http.get(USERS_URL, ({ request }) => {
    const cursor = new URL(request.url).searchParams.get('cursor')
    return cursor ? json({ users: next }) : json({ users: first, next_cursor: nextCursor })
  })
}

const empty = { render: () => null }

export function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: empty },
      { path: '/kullanicilar', name: 'organization.users', component: empty },
      { path: '/kullanicilar/:accountId', name: 'organization.user', component: empty },
      { path: '/koordinatorlukler', name: 'organization.coordinatorships', component: empty },
    ],
  })
}

export interface Mounted {
  wrapper: VueWrapper
  router: Router
  store: ReturnType<typeof useScopeStore>
  queryClient: QueryClient
}

const mounted: VueWrapper[] = []

/** Bileşeni (ve onay yuvasını) kapsam + router + sorgu bağlamıyla bağlar. */
export async function mountWith(
  component: Component,
  props: Record<string, unknown>,
  options: { selection?: ScopeSelection; path?: string; stubs?: Record<string, Component> } = {},
): Promise<Mounted> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit(options.selection ?? { programId: 'p1', lens: 'admin', departmentId: null })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  })
  const router = makeRouter()
  await router.push(options.path ?? '/kullanicilar')
  const host = defineComponent({
    setup:
      (_, { attrs }) =>
      () => [h(component, attrs), h(ConfirmHost)],
  })
  const wrapper = mount(host, {
    attrs: props,
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }], router],
      stubs: options.stubs ?? {},
    },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  await settle()
  return { wrapper, router, store, queryClient }
}

/** Ağ + render turlarını boşaltır. */
export async function settle(): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

export function unmountAll(): void {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
}

/** Onay penceresindeki düğme (ConfirmHost; metne göre). */
export function confirmButton(label: string): HTMLButtonElement | undefined {
  return [
    ...document.querySelectorAll<HTMLButtonElement>('[data-testid="confirm-dialog"] button'),
  ].find((b) => b.textContent?.trim() === label)
}
