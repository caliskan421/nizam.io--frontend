import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { i18n } from '@/shared/i18n'

import {
  ADMIN,
  errorEnvelope,
  folder,
  folderBody,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  standing,
} from '../model/__tests__/harness'
import ArchivePage from './ArchivePage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
let mounted: ReturnType<typeof mount> | undefined
afterEach(() => {
  mounted?.unmount()
  mounted = undefined
  resetHarness()
})
afterAll(() => server.close())

it('depolama kartı: klasör okuması başarısızsa sıfır/boş değil hata, yeniden dene aynı okumayı tekrarlar', async () => {
  let failing = true
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => (release = resolve))
  const cards = folderBody(folder({ folder_id: 'd1', file_count: 1, total_bytes: 50 }))
  server.use(
    ...standing({ admin: true }),
    http.get(`${ORIGIN}/v1/program/archive/tasks`, () => json({ tasks: [] })),
    http.get(`${ORIGIN}/v1/program/archive/folders`, async () => {
      if (!failing) await gate
      return failing
        ? errorEnvelope('platform.internal', 500)
        : json({
            ...cards,
            totals: {
              ...cards.totals,
              by_type: [{ type: 'pdf', file_count: 1, total_bytes: 50 }],
              by_tag: [{ tag: 'plan', file_count: 1, total_bytes: 50 }],
            },
          })
    }),
  )
  const h = harness(ADMIN)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/arsiv', name: 'archive.folders', component: ArchivePage },
      { path: '/arsiv/:klasorId', name: 'archive.folder', component: { template: '<i />' } },
      { path: '/arsiv/donem-raporu', name: 'reports.season', component: { template: '<i />' } },
    ],
  })
  await router.push('/arsiv')
  await router.isReady()
  mounted = mount(ArchivePage, {
    global: {
      plugins: [getActivePinia()!, i18n, router, [VueQueryPlugin, { queryClient: h.queryClient }]],
    },
    attachTo: document.body,
  })
  await settleQueries(h.queryClient)
  await flushPromises()
  const storage = mounted.get('.archive-storage')
  expect(storage.get('[data-field="error"]').text()).toContain('okunamadı')
  expect(storage.find('[data-field="empty"]').exists()).toBe(false)
  expect(storage.get('[data-field="files"]').text()).toBe('—')
  expect(storage.text()).not.toMatch(/\b0 B\b|%0/)

  const before = sent('GET', '/v1/program/archive/folders').length
  failing = false
  await storage.get('[data-action="retry"]').trigger('click')
  // Yeniden çekme sürerken (sorgu fetching): meşgul, hata/sıfır yok,
  // ikinci tıklama için düğme yok; aynı sorgu tek okuma yapar.
  await vi.waitFor(() =>
    expect(sent('GET', '/v1/program/archive/folders')).toHaveLength(before + 1),
  )
  const busy = mounted.get('.archive-storage')
  // Gerçek TanStack durumu: tam bir sorgu hâlâ fetching (mock/bayrak değil).
  expect(
    h.queryClient
      .getQueryCache()
      .findAll()
      .filter((q) => q.state.fetchStatus === 'fetching'),
  ).toHaveLength(1)
  expect(busy.get('.archive-storage__total').attributes('aria-busy')).toBe('true')
  expect(busy.find('[data-field="error"]').exists()).toBe(false)
  expect(busy.find('[data-action="retry"]').exists()).toBe(false)
  expect(busy.find('[data-field="empty"]').exists()).toBe(false)
  expect(busy.text()).not.toMatch(/\b0 B\b|%0/)
  release?.()
  await settleQueries(h.queryClient)
  await flushPromises()
  expect(sent('GET', '/v1/program/archive/folders')).toHaveLength(before + 1)
  expect(mounted.get('.archive-storage').find('[data-field="error"]').exists()).toBe(false)
  const type = mounted.get('.archive-storage [data-axis="type"]').text()
  const tag = mounted.get('.archive-storage [data-axis="tag"]').text()
  expect(type).toMatch(/PDF.*1 dosya.*50 B.*%100/)
  expect(tag).toMatch(/Plan.*1 dosya.*50 B.*%100/)
})

it('depolama kartı: önbellekli toplamlar, arka plan yeniden çekmesi hata verip sonraki çekme beklerken gizlenmez', async () => {
  let mode: 'ok' | 'fail' | 'hold' = 'ok'
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => (release = resolve))
  const cards = folderBody(folder({ folder_id: 'd1', file_count: 3, total_bytes: 105 }))
  server.use(
    ...standing({ admin: true }),
    http.get(`${ORIGIN}/v1/program/archive/tasks`, () => json({ tasks: [] })),
    http.get(`${ORIGIN}/v1/program/archive/folders`, async () => {
      if (mode === 'fail') return errorEnvelope('platform.internal', 500)
      if (mode === 'hold') await gate
      return json({
        ...cards,
        totals: {
          ...cards.totals,
          file_count: 3,
          total_bytes: 105,
          by_type: [
            { type: 'pdf', file_count: 2, total_bytes: 70 },
            { type: 'image', file_count: 1, total_bytes: 35 },
          ],
          by_tag: [{ tag: 'plan', file_count: 3, total_bytes: 105 }],
        },
      })
    }),
  )
  const h = harness(ADMIN)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/arsiv', name: 'archive.folders', component: ArchivePage },
      { path: '/arsiv/:klasorId', name: 'archive.folder', component: { template: '<i />' } },
      { path: '/arsiv/donem-raporu', name: 'reports.season', component: { template: '<i />' } },
    ],
  })
  await router.push('/arsiv')
  await router.isReady()
  mounted = mount(ArchivePage, {
    global: {
      plugins: [getActivePinia()!, i18n, router, [VueQueryPlugin, { queryClient: h.queryClient }]],
    },
    attachTo: document.body,
  })
  await settleQueries(h.queryClient)
  await flushPromises()
  expect(mounted.get('.archive-storage [data-field="bytes"]').text()).toBe('105 B')

  mode = 'fail'
  await h.queryClient.refetchQueries()
  await flushPromises()
  mode = 'hold'
  const before = sent('GET', '/v1/program/archive/folders').length
  const pending = h.queryClient.refetchQueries()
  await vi.waitFor(() =>
    expect(sent('GET', '/v1/program/archive/folders')).toHaveLength(before + 1),
  )
  // Gerçek sorgu: hata durumunda, veri önbellekte ve sonraki çekme sürüyor.
  const query = h.queryClient
    .getQueryCache()
    .findAll()
    .find((q) => q.state.fetchStatus === 'fetching')!
  expect(query.state.status).toBe('error')
  expect(query.state.data).toBeDefined()
  const card = mounted.get('.archive-storage')
  expect(card.get('.archive-storage__total').attributes('aria-busy')).toBeUndefined()
  expect(card.get('[data-field="files"]').text()).toBe('3')
  expect(card.get('[data-field="bytes"]').text()).toBe('105 B')
  expect(card.get('[data-axis="type"]').text()).toMatch(/PDF.*2 dosya.*70 B/)
  expect(card.get('[data-axis="tag"]').text()).toMatch(/Plan.*3 dosya.*105 B/)
  release?.()
  await pending
})
