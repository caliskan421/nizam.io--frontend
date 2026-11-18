import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { i18n } from '@/shared/i18n'

import {
  ADMIN,
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

it('yöneticinin mevcut depolama kartı dönen dosyaların tür ve etiket dağılımını gösterir', async () => {
  const cards = folderBody(
    folder({ folder_id: 'd1', file_count: 4, task_count: 2, total_bytes: 400 }),
  )
  server.use(
    ...standing({ admin: true }),
    http.get(`${ORIGIN}/v1/program/archive/tasks`, () => json({ tasks: [] })),
    http.get(`${ORIGIN}/v1/program/archive/folders`, () =>
      json({
        ...cards,
        totals: {
          ...cards.totals,
          by_type: [
            { type: 'pdf', file_count: 3, total_bytes: 300 },
            { type: 'image', file_count: 1, total_bytes: 100 },
          ],
          by_tag: [
            { tag: 'plan', file_count: 2, total_bytes: 200 },
            { tag: 'sonuc', file_count: 2, total_bytes: 200 },
          ],
        },
      }),
    ),
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
  const call = sent('GET', '/v1/program/archive/folders')[0]!
  expect(call.headers.get('X-Nizamio-Program')).toBe('p1')
  expect(call.headers.get('X-Nizamio-Department')).toBeNull()
  const storage = mounted.get('.archive-storage')
  expect(storage.text()).toContain('400 B')
  expect(storage.text()).toMatch(/pdf/i)
  expect(storage.text()).toMatch(/görsel/i)
  expect(storage.text()).toMatch(/plan/i)
  expect(storage.text()).toMatch(/sonuç/i)
  expect(storage.text()).toContain('300 B')
  expect(storage.text()).toContain('100 B')
  expect(storage.text()).toContain('200 B')
  expect(storage.text()).not.toMatch(/en büyük klasör/i)
})
