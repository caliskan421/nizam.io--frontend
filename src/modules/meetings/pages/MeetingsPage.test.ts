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
import { afterAll, beforeAll, vi } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import { i18n } from '@/shared/i18n'
import { settleQueries } from '@/shared/http/__tests__/settle'

vi.mock('@/shared/scope/standing', () => ({
  useStanding: () => ({
    standing: ref({ companyAdmin: true, rows: [] }),
    programs: ref([{ programId: 'p', name: 'Sezon' }]),
  }),
}))
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
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
