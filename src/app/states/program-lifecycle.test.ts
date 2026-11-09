// "Teknofest ve sezon" (W81) + GERÇEK kabuk: uygulama kökü (App.vue), üretim router'ı, kapsam
// yaşam döngüsü ve onay yuvası (ConfirmHost) sahte backend (MSW) karşısında. Seçili program
// silinince ['programs'] + standing yenilenir ve kabuk kalan programa ya da "program yok" açık
// durumuna doğru düşer (K2, K7).
import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'

import {
  freshModules,
  newQueryClient,
  standingHandlers,
  type StandingFixture,
} from '@/shared/scope/__tests__/harness'

import { createFakeBackend } from '../../../tests/support/fake-backend'

const backend = createFakeBackend()
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  backend.server.resetHandlers()
  backend.reset()
  document.body.innerHTML = ''
})
afterAll(() => backend.server.close())

const pageData = [
  http.get('http://localhost/v1/notifications/unread-count', () => HttpResponse.json({ count: 0 })),
  http.get('http://localhost/v1/program-transfers', () => HttpResponse.json({ transfers: [] })),
  http.get('http://localhost/v1/departments', () => HttpResponse.json({ departments: [] })),
]

/** Silme: parola doğruysa programı sahte listeden düşürür (sonraki `listPrograms` görür). */
function deleteHandler(fixture: StandingFixture) {
  return http.delete('http://localhost/v1/programs/:id', async ({ params, request }) => {
    const body = (await request.json()) as { password?: string }
    if (body.password !== 'dogru-parola') return backend.envelope('program.password_invalid', 401)
    if (Array.isArray(fixture.programs)) {
      fixture.programs = fixture.programs.filter((p) => p.program_id !== params.id)
    }
    return new HttpResponse(null, { status: 204 })
  })
}

async function boot(fixture: StandingFixture) {
  backend.server.use(...standingHandlers(backend, fixture), ...pageData, deleteHandler(fixture))
  const m = await freshModules()
  m.preferences.preferences.write('scope.programId', 'p1')
  m.preferences.preferences.write('scope.lens', 'admin')
  const { default: App } = await import('@/app/App.vue')
  const { createAppRouter } = await import('@/app/router')
  const { i18n } = await import('@/shared/i18n')
  const router = createAppRouter(createMemoryHistory())
  await router.push('/programlar')
  const wrapper = mount(App, {
    global: {
      plugins: [m.pinia, [VueQueryPlugin, { queryClient: newQueryClient() }], router, i18n],
    },
    attachTo: document.body,
  })
  await vi.waitFor(() => expect(wrapper.find('[data-testid="programs-page"]').exists()).toBe(true))
  await flushPromises()
  return { m, wrapper, router, store: m.store.useScopeStore() }
}

const $ = (selector: string) => document.body.querySelector<HTMLElement>(selector)

async function deleteProgram(programId: string) {
  await vi.waitFor(() =>
    expect($(`[data-program="${programId}"] [data-testid="pg-delete"]`)).not.toBeNull(),
  )
  $(`[data-program="${programId}"] [data-testid="pg-delete"]`)!.click()
  await vi.waitFor(() => expect($('[name="password"]')).not.toBeNull())
  const input = $('[name="password"]') as HTMLInputElement
  input.value = 'dogru-parola'
  input.dispatchEvent(new Event('input'))
  await flushPromises()
  $('[data-testid="pg-danger-submit"]')!.click()
  await vi.waitFor(() => expect($('[data-testid="confirm-accept"]')).not.toBeNull())
  $('[data-testid="confirm-accept"]')!.click()
}

describe('program yönetimi + gerçek kabuk', () => {
  it('menüde "Teknofest ve sezon" (Yönetim); seçili program silinince kabuk kalan programa geçer', async () => {
    const fixture: StandingFixture = {
      companyAdmin: true,
      rows: [],
      programs: [
        { program_id: 'p1', name: 'Teknofest 2026', year: 2026 },
        { program_id: 'p2', name: 'Teknofest 2027', year: 2027 },
      ],
    }
    const { wrapper, store } = await boot(fixture)
    expect(store.programId).toBe('p1')
    expect(wrapper.find('[data-testid="topbar-crumbs"]').text()).toMatch(
      /Teknofest 2026\s*\/\s*Teknofest ve sezon/,
    )
    expect(wrapper.find('aside.rp-side').text()).toContain('Teknofest ve sezon')
    await deleteProgram('p1')
    await vi.waitFor(() => expect(store.programId).toBe('p2'))
    await vi.waitFor(() => expect($('[data-program="p1"]')).toBeNull())
    expect($('[data-program="p2"]')?.dataset.current).toBe('true')
    expect(backend.state.requests.filter((r) => r.path === '/v1/programs').length).toBeGreaterThan(
      1,
    )
    expect(wrapper.find('[data-testid="topbar-crumbs"]').text()).toContain('Teknofest 2027')
  })

  it('son program silinince kabuk "program yok" açık durumuna düşer', async () => {
    const fixture: StandingFixture = {
      companyAdmin: true,
      rows: [],
      programs: [{ program_id: 'p1', name: 'Teknofest 2026', year: 2026 }],
    }
    const { wrapper, store } = await boot(fixture)
    await deleteProgram('p1')
    await vi.waitFor(() =>
      expect(wrapper.find('[data-open-state="state.no-program"]').exists()).toBe(true),
    )
    expect(store.programId).toBeNull()
  })
})
