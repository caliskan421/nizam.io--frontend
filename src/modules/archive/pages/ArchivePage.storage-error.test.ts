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
  const cards = folderBody(folder({ folder_id: 'd1', file_count: 1, total_bytes: 50 }))
  server.use(
    ...standing({ admin: true }),
    http.get(`${ORIGIN}/v1/program/archive/tasks`, () => json({ tasks: [] })),
    http.get(`${ORIGIN}/v1/program/archive/folders`, () => {
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
  await settleQueries(h.queryClient)
  await flushPromises()
  expect(sent('GET', '/v1/program/archive/folders')).toHaveLength(before + 1)
  expect(mounted.get('.archive-storage').find('[data-field="error"]').exists()).toBe(false)
  const type = mounted.get('.archive-storage [data-axis="type"]').text()
  const tag = mounted.get('.archive-storage [data-axis="tag"]').text()
  expect(type).toMatch(/PDF.*1 dosya.*50 B.*%100/)
  expect(tag).toMatch(/Plan.*1 dosya.*50 B.*%100/)
})
