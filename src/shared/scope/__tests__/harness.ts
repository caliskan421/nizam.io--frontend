// Kapsam yaşam döngüsü testleri için ortak düzenek: sahte standing uçları (MSW), taze modül
// grafiği (tekil oturum/istemci nesneleri test başına yeniden kurulur), bileşen bağlamında
// `useScopeLifecycle()`.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { vi } from 'vitest'

import type { createFakeBackend } from '../../../../tests/support/fake-backend'

type Backend = ReturnType<typeof createFakeBackend>

export interface FixtureRow {
  program_id: string
  program_name: string
  department_id: string
  display_name: string
  role: string
}

export interface StandingFixture {
  companyAdmin: boolean
  rows: FixtureRow[]
  programs: Array<{ program_id: string; name: string; year?: number }> | 'membership_required'
  programsTruncated?: boolean
}

export const row = (program: string, department: string, role: string): FixtureRow => ({
  program_id: program,
  program_name: `Program ${program}`,
  department_id: department,
  display_name: `Birim ${department}`,
  role,
})

export function standingHandlers(backend: Backend, fixture: StandingFixture) {
  const record = (request: Request) => {
    backend.state.requests.push({
      method: request.method,
      path: new URL(request.url).pathname,
      headers: new Headers(request.headers),
      body: '',
      credentials: request.credentials,
    })
  }
  return [
    http.get('http://localhost/v1/me', ({ request }) => {
      record(request)
      return HttpResponse.json({
        account_id: 'acc-1',
        email: 'kisi@example.test',
        full_name: 'Deneme Kişi',
        company_admin: fixture.companyAdmin,
      })
    }),
    http.get('http://localhost/v1/me/departments', ({ request }) => {
      record(request)
      return HttpResponse.json({ departments: fixture.rows })
    }),
    http.get('http://localhost/v1/programs', ({ request }) => {
      record(request)
      if (fixture.programs === 'membership_required') {
        return backend.envelope('organization.membership_required', 403)
      }
      return HttpResponse.json(
        { programs: fixture.programs },
        { headers: fixture.programsTruncated ? { 'X-Result-Truncated': 'true' } : {} },
      )
    }),
  ]
}

export function createTarget() {
  const window = new EventTarget()
  const visibility: { visibilityState: DocumentVisibilityState } = { visibilityState: 'visible' }
  const document = Object.assign(new EventTarget(), visibility)
  return { window, document }
}

/** Taze modül grafiği + giriş yapılmış oturum. */
export async function freshModules() {
  vi.stubGlobal('BroadcastChannel', undefined)
  vi.resetModules()
  const pinia = createPinia()
  setActivePinia(pinia)
  const modules = {
    session: await import('@/shared/session/store'),
    http: await import('@/shared/http'),
    preferences: await import('@/shared/preferences'),
    scope: await import('@/shared/scope/scope'),
    store: await import('@/shared/scope/store'),
    standing: await import('@/shared/scope/standing'),
    lifecycle: await import('@/shared/scope/lifecycle'),
    signOut: await import('@/shared/scope/sign-out'),
    errors: await import('@/shared/errors/api-error'),
  }
  modules.preferences.preferences.clearAll()
  await modules.session.useSessionStore().login({
    email: 'kisi@example.test',
    password: 'dogru-parola',
  })
  return { pinia, ...modules }
}

export function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
}

/** `setup` fonksiyonunu bileşen bağlamında çalıştırır; dönüşünü verir. */
export function withSetup<T>(
  setup: () => T,
  pinia: ReturnType<typeof createPinia>,
  queryClient: QueryClient,
) {
  let result: T | undefined
  const wrapper = mount(
    defineComponent({
      setup() {
        result = setup()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] } },
  )
  return { result: result as T, wrapper }
}
