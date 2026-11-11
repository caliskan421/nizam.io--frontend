import { expect, it } from 'vitest'
import Page from './MeetingsPage.vue'

it('has a page declaration independent of its body', () => {
  expect(Object.keys(Page.props ?? {})).toEqual([])
  expect(Page.emits ?? []).toEqual([])
})

import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ref } from 'vue'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, beforeEach, vi } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import type * as StandingModule from '@/shared/scope/standing'
import { i18n } from '@/shared/i18n'
import { settleQueries, until } from '@/shared/http/__tests__/settle'
import { flushPromises } from '@vue/test-utils'

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
      HttpResponse.json({ items: [{ meeting_id: 'deleted' }], next_cursor: '' }),
    ),
  ),
)
afterAll(() => server.close())

it('stops after a page error and offers a user retry', async () => {
  let pages = 0
  let fail = true
  server.use(
    http.get('http://localhost/v1/program/departments', () =>
      HttpResponse.json({ departments: [] }),
    ),
  )
  server.use(
    http.get('http://localhost/v1/meetings', ({ request }) => {
      if (!new URL(request.url).searchParams.has('cursor'))
        return HttpResponse.json({ items: [], next_cursor: 'next' })
      pages++
      return fail
        ? HttpResponse.json({ code: 'error' }, { status: 500 })
        : HttpResponse.json({ items: [], next_cursor: '' })
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/toplantilar', component: Page }],
  })
  await router.push('/toplantilar')
  await router.isReady()
  const wrapper = mount(Page, {
    global: { plugins: [pinia, i18n, router, [VueQueryPlugin, { queryClient: client }]] },
  })
  await settleQueries(client)
  expect(wrapper.text()).toContain('Diğer toplantılar yüklenemedi')
  expect(wrapper.text()).toContain('Silinenler 1')
  expect(pages).toBe(3)
  fail = false
  const button = wrapper.findAll('button').find((b) => b.text() === 'Yeniden dene')
  await button!.trigger('click')
  await settleQueries(client)
  expect(wrapper.text()).not.toContain('Diğer toplantılar yüklenemedi')
  expect(pages).toBe(4)
  wrapper.unmount()
  client.clear()
})

it('blocks invalid URL dates before the first request and starts with corrected filters', async () => {
  const urls: URL[] = []
  server.use(
    http.get('http://localhost/v1/program/departments', () =>
      HttpResponse.json({
        departments: [{ department_id: 'd', display_name: 'Ekip', code: 'EKP' }],
      }),
    ),
  )
  server.use(
    http.get('http://localhost/v1/meetings', ({ request }) => {
      urls.push(new URL(request.url))
      return HttpResponse.json({ items: [], next_cursor: '' })
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
  await router.push('/toplantilar?from=2026-02-30&to=2026-03-01')
  const wrapper = mount(Page, {
    global: { plugins: [pinia, i18n, router, [VueQueryPlugin, { queryClient: client }]] },
  })
  await settleQueries(client)
  expect(urls).toHaveLength(0)
  expect(wrapper.find('[role=alert]').exists()).toBe(true)
  await router.replace('/toplantilar?from=2026-02-28&to=2026-03-01')
  await until(
    () => urls.length > 0,
    (notify) => client.getQueryCache().subscribe(notify),
  )
  await flushPromises()
  expect(urls).toHaveLength(1)
  expect(urls[0]?.searchParams.get('from')).toBe('2026-02-28')
  expect(urls[0]?.searchParams.get('to')).toBe('2026-03-01')
  expect(wrapper.text()).toContain('yüklenen kayıtlar içinde')
  expect(wrapper.get('.meetings-foot').text()).toContain('0 yaklaşan toplantı')
  expect(wrapper.get('.meetings-foot').text()).not.toContain('0 0 yaklaşan')
  await wrapper
    .findAll('button')
    .find((button) => button.text().includes('Koordinatörlük'))!
    .trigger('click')
  await wrapper
    .findAll('[role=menuitemradio]')
    .find((item) => item.text() === 'Ekip')!
    .trigger('click')
  await until(
    () => urls.some((url) => url.searchParams.get('department_id') === 'd'),
    (notify) => client.getQueryCache().subscribe(notify),
  )
  expect(router.currentRoute.value.query.koordinatorluk).toBe('d')
  const upcoming = wrapper.get('#meeting-tab-yaklasan')
  expect(wrapper.get('#meeting-list-panel').attributes('aria-labelledby')).toBe(
    'meeting-tab-yaklasan',
  )
  await upcoming.trigger('keydown', { key: 'ArrowRight' })
  await flushPromises()
  expect(router.currentRoute.value.query.zaman).toBe('gecmis')
  expect(wrapper.get('#meeting-list-panel').attributes('aria-labelledby')).toBe(
    'meeting-tab-gecmis',
  )
  expect(wrapper.get('#meeting-tab-gecmis').attributes('aria-selected')).toBe('true')
  wrapper.unmount()
  client.clear()
})

it('closes the create form when scope or session changes', async () => {
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
  const scope = useScopeStore()
  scope.commit({ programId: 'p', departmentId: null, lens: 'admin' })
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
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Yeni toplantı')!
    .trigger('click')
  expect(wrapper.findComponent({ name: 'MeetingForm' }).exists()).toBe(true)
  scope.commit({ programId: 'p2', departmentId: null, lens: 'admin' })
  await import('vue').then(({ nextTick }) => nextTick())
  expect(wrapper.findComponent({ name: 'MeetingForm' }).exists()).toBe(false)
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Yeni toplantı')!
    .trigger('click')
  expect(wrapper.findComponent({ name: 'MeetingForm' }).exists()).toBe(true)
  const { authSession } = await import('@/shared/http')
  authSession.clear()
  await import('vue').then(({ nextTick }) => nextTick())
  expect(wrapper.findComponent({ name: 'MeetingForm' }).exists()).toBe(false)
  wrapper.unmount()
  client.clear()
})
