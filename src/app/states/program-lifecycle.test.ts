// "Teknofest ve sezon" (W81) + GERÇEK kabuk: uygulama kökü (App.vue), üretim router'ı, kapsam
// yaşam döngüsü ve onay yuvası (ConfirmHost) sahte backend (MSW) karşısında (K2, K7):
//  - "program yok" → "Program oluştur" bağlantısı → `/programlar` → oluştur → kabuk normal duruma;
//  - seçili program silinince kabuk kalan programa / "program yok" durumuna düşer.
// Deterministik: gerçek süre beklemesi yok (beklemeler DOM/durum koşuluna bağlı, sahte backend
// anında yanıtlar); soğuk dönüşüm maliyeti `beforeAll` ısınmasında ödenir (shell.lifecycle kalıbı),
// testlerin kendi süresi makine yükünden bağımsız kalır.
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
// Isınma: bir kez tam açılış (App + üretim router'ı + tembel program sayfası + kabuk). Soğuk
// dönüşüm testlerin süresine yüklenmez; modüller her testte `freshModules` ile yeniden kurulur.
beforeAll(async () => {
  const { wrapper } = await boot({ companyAdmin: true, rows: [], programs: [] }, '/programlar')
  await until(() => $('[data-testid="pg-empty"]'))
  wrapper.unmount()
  reset()
}, 30_000)
afterEach(() => reset())
afterAll(() => backend.server.close())

function reset(): void {
  backend.server.resetHandlers()
  backend.reset()
  document.body.innerHTML = ''
}

const pageData = [
  http.get('http://localhost/v1/notifications/unread-count', () => HttpResponse.json({ count: 0 })),
  http.get('http://localhost/v1/program-transfers', () => HttpResponse.json({ transfers: [] })),
  http.get('http://localhost/v1/departments', () => HttpResponse.json({ departments: [] })),
  // 01 ana sayfanın kapsamlı okumaları (Admin: pano) — boş yanıt.
  http.get('http://localhost/v1/reports/dashboard', () =>
    HttpResponse.json({
      total_tasks: 0,
      completed_tasks: 0,
      active_tasks: 0,
      overdue_tasks: 0,
      pending_approvals: 0,
    }),
  ),
  http.get('http://localhost/v1/program/work-items', () => HttpResponse.json({ items: [] })),
]

/** Program yazmaları sahte listeyi değiştirir (sonraki `listPrograms` görür). */
function programWrites(fixture: StandingFixture) {
  const list = () => (Array.isArray(fixture.programs) ? fixture.programs : [])
  return [
    http.delete('http://localhost/v1/programs/:id', async ({ params, request }) => {
      const body = (await request.json()) as { password?: string }
      if (body.password !== 'dogru-parola') {
        return backend.envelope('program.password_invalid', 401)
      }
      fixture.programs = list().filter((p) => p.program_id !== params.id)
      return new HttpResponse(null, { status: 204 })
    }),
    http.post('http://localhost/v1/programs', async ({ request }) => {
      const body = (await request.json()) as { name: string }
      const created = { program_id: 'p-yeni', name: body.name }
      fixture.programs = [...list(), created]
      return HttpResponse.json({ ...created, created: true }, { status: 201 })
    }),
  ]
}

async function boot(fixture: StandingFixture, path: string, remembered: string | null = 'p1') {
  backend.server.use(...standingHandlers(backend, fixture), ...pageData, ...programWrites(fixture))
  const m = await freshModules()
  m.preferences.preferences.write('scope.programId', remembered)
  m.preferences.preferences.write('scope.lens', 'admin')
  const { default: App } = await import('@/app/App.vue')
  const { createAppRouter } = await import('@/app/router')
  const { i18n } = await import('@/shared/i18n')
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  const wrapper = mount(App, {
    global: {
      plugins: [m.pinia, [VueQueryPlugin, { queryClient: newQueryClient() }], router, i18n],
    },
    attachTo: document.body,
  })
  await until(() => $('[data-testid="app-shell"]'))
  return { m, wrapper, router, store: m.store.useScopeStore() }
}

const $ = (selector: string) => document.body.querySelector<HTMLElement>(selector)

/** Koşul sağlanana dek söz kuyruğunu boşaltır (gerçek süre beklemesi yok; üst sınır döngü). */
async function until<T>(probe: () => T | null | undefined | false, rounds = 200): Promise<T> {
  for (let i = 0; i < rounds; i += 1) {
    const value = probe()
    if (value) return value
    await flushPromises()
    await new Promise<void>((resolve) => queueMicrotask(resolve))
    await vi.dynamicImportSettled()
  }
  throw new Error('koşul sağlanmadı')
}

async function type(selector: string, value: string): Promise<void> {
  const input = await until(() => $(selector) as HTMLInputElement | null)
  input.value = value
  input.dispatchEvent(new Event('input'))
  await flushPromises()
}

async function deleteProgram(programId: string): Promise<void> {
  ;(await until(() => $(`[data-program="${programId}"] [data-testid="pg-delete"]`))).click()
  await type('[name="password"]', 'dogru-parola')
  $('[data-testid="pg-danger-submit"]')!.click()
  ;(await until(() => $('[data-testid="confirm-accept"]'))).click()
}

describe('program yönetimi + gerçek kabuk', () => {
  it('program yok → "Program oluştur" bağlantısı → /programlar → oluştur → kabuk normal duruma geçer', async () => {
    const fixture: StandingFixture = { companyAdmin: true, rows: [], programs: [] }
    const { router, store } = await boot(fixture, '/', null)
    const link = await until(() =>
      $('[data-open-state="state.no-program"] [data-testid="open-state-action"]'),
    )
    expect(link.textContent?.trim()).toBe('Program oluştur')
    link.click()
    await until(() => router.currentRoute.value.name === 'program.programs')
    ;(await until(() => $('[data-testid="pg-empty"] button'))).click()
    await type('[name="name"]', 'Teknofest 2027')
    ;(await until(() => $('[data-testid="pg-form-submit"]'))).click()
    await until(() => store.programId === 'p-yeni')
    await until(() => $('[data-program="p-yeni"]')?.dataset.current === 'true')
    expect($('[data-open-state]')).toBeNull()
    await router.push('/')
    await until(() => $('[data-testid="home-page"]'))
    expect($('[data-open-state]')).toBeNull()
    expect($('[data-testid="topbar-crumbs"]')?.textContent).toContain('Teknofest 2027')
  })

  it('seçili program silinince kabuk kalan programa geçer; menüde "Teknofest ve sezon"', async () => {
    const fixture: StandingFixture = {
      companyAdmin: true,
      rows: [],
      programs: [
        { program_id: 'p1', name: 'Teknofest 2026', year: 2026 },
        { program_id: 'p2', name: 'Teknofest 2027', year: 2027 },
      ],
    }
    const { store } = await boot(fixture, '/programlar')
    await until(() => store.programId === 'p1')
    expect($('aside.rp-side')?.textContent).toContain('Teknofest ve sezon')
    await deleteProgram('p1')
    await until(() => store.programId === 'p2')
    await until(() => !$('[data-program="p1"]'))
    expect($('[data-program="p2"]')?.dataset.current).toBe('true')
    expect($('[data-testid="topbar-crumbs"]')?.textContent).toContain('Teknofest 2027')
  })

  it('son program silinince: program sayfası kendi boş durumunu gösterir, diğer rotada "program yok"', async () => {
    const fixture: StandingFixture = {
      companyAdmin: true,
      rows: [],
      programs: [{ program_id: 'p1', name: 'Teknofest 2026', year: 2026 }],
    }
    const { router, store } = await boot(fixture, '/programlar')
    await deleteProgram('p1')
    await until(() => $('[data-testid="pg-empty"]'))
    expect(store.programId).toBeNull()
    expect($('[data-open-state]')).toBeNull()
    await router.push('/')
    await until(() => $('[data-open-state="state.no-program"]'))
  })
})
