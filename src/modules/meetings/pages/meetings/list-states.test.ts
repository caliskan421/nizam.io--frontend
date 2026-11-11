import { expect, it, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ref } from 'vue'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { useScopeStore } from '@/shared/scope/store'
import type * as StandingModule from '@/shared/scope/standing'
import { i18n } from '@/shared/i18n'
import { settleQueries } from '@/shared/http/__tests__/settle'
import Page from '../MeetingsPage.vue'
const standingState = vi.hoisted(() => ({ admin: true }))
vi.mock('@/shared/scope/standing', async (importOriginal) => ({
  ...(await importOriginal<typeof StandingModule>()),
  useStanding: () => ({
    standing: ref({ companyAdmin: standingState.admin, rows: [] }),
    programs: ref([{ programId: 'p', name: 'Sezon' }]),
  }),
}))
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() =>
  server.use(
    http.get('http://localhost/v1/meetings/deleted', () =>
      HttpResponse.json({ items: [], next_cursor: '' }),
    ),
  ),
)
afterAll(() => server.close())

it('hides creation and deleted tabs for a member', async () => {
  standingState.admin = false
  server.use(
    http.get('http://localhost/v1/program/departments', () =>
      HttpResponse.json({ departments: [] }),
    ),
  )
  server.use(
    http.get('http://localhost/v1/meetings', () =>
      HttpResponse.json({ items: [], next_cursor: '' }),
    ),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: 'd', lens: 'member' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/toplantilar', component: Page }],
  })
  await router.push('/toplantilar?zaman=silinenler')
  const wrapper = mount(Page, {
    global: { plugins: [pinia, i18n, router, [VueQueryPlugin, { queryClient: client }]] },
  })
  await settleQueries(client)
  expect(wrapper.text()).not.toContain('Yeni toplantı')
  expect(wrapper.text()).not.toContain('Silinenler')
  expect(wrapper.text()).toContain('Üye olarak')
  wrapper.unmount()
  client.clear()
  standingState.admin = true
})

it('stops the automatic drain on repeated cursors, including empty pages', async () => {
  let requests = 0
  server.use(
    http.get('http://localhost/v1/program/departments', () =>
      HttpResponse.json({ departments: [] }),
    ),
  )
  server.use(
    http.get('http://localhost/v1/meetings', () => {
      requests++
      return HttpResponse.json({ items: [], next_cursor: 'same' })
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/toplantilar', component: Page }],
  })
  await router.push('/toplantilar')
  const wrapper = mount(Page, {
    global: { plugins: [pinia, i18n, router, [VueQueryPlugin, { queryClient: client }]] },
  })
  await settleQueries(client)
  expect(wrapper.text()).toContain('Diğer toplantılar yüklenemedi')
  expect(requests).toBe(2)
  await flushPromises()
  expect(requests).toBe(2)
  wrapper.unmount()
  client.clear()
})

it('shows coded 422 errors without displaying the server message', async () => {
  server.use(
    http.get('http://localhost/v1/program/departments', () =>
      HttpResponse.json({ departments: [] }),
    ),
  )
  server.use(
    http.get('http://localhost/v1/meetings', () =>
      HttpResponse.json(
        {
          code: 'collaboration.input_invalid',
          message: 'özel sunucu metni',
          request_id: 'req-1',
          fields: [],
        },
        { status: 422 },
      ),
    ),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/toplantilar', component: Page }],
  })
  await router.push('/toplantilar?from=2026-01-01')
  const wrapper = mount(Page, {
    global: { plugins: [pinia, i18n, router, [VueQueryPlugin, { queryClient: client }]] },
  })
  await settleQueries(client)
  expect(wrapper.get('[role=alert]').text()).toContain('Girilen bilgiler geçersiz.')
  expect(wrapper.text()).not.toContain('özel sunucu metni')
  wrapper.unmount()
  client.clear()
})
