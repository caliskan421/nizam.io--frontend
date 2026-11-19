import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia } from 'pinia'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'

import { auditExportTarget } from '../model/export'
import { auditFilters, queryAudit } from '../model/filters'
import type { AuditEntry } from '../model/types'
import AuditHistoryPage from './AuditHistoryPage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))
const origin = 'http://localhost'
const server = setupServer()
const auditRequests: URL[] = []
const entry: AuditEntry = {
  entry_id: 'event-1',
  action_code: 'work.item.created',
  category: 'task',
  actor_account_id: 'person-1',
  actor_full_name: 'Ayşe',
  occurred_at: '2026-11-01T22:00:00Z',
  client_agent: 'Chrome · macOS',
  client_ip: '192.0.2.1',
  details: 'saklanacak ham ayrıntı',
  department_id: 'd1',
  program_id: 'p1',
  outcome: 'succeeded',
  subject_id: 'w1',
  subject_kind: 'work_item',
  target_name: 'Ölçüm görevi',
  work_item_id: 'w1',
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
enableAutoUnmount(afterEach)
afterEach(() => {
  server.resetHandlers()
  auditRequests.length = 0
})
afterAll(() => server.close())

async function open(opts: { admin?: boolean; selected?: boolean; membership?: boolean } = {}) {
  server.use(
    http.get(origin + '/v1/me', () =>
      HttpResponse.json({
        account_id: 'person-1',
        full_name: 'Ayşe',
        email: 'example@example.test',
        company_admin: opts.admin === true,
      }),
    ),
    http.get(origin + '/v1/me/departments', () =>
      HttpResponse.json({
        departments: opts.membership
          ? [
              {
                program_id: 'p1',
                program_name: 'Program',
                department_id: 'd1',
                display_name: 'Saha',
                role: 'uye',
              },
            ]
          : [],
      }),
    ),
    http.get(origin + '/v1/programs', () =>
      HttpResponse.json({ programs: [{ program_id: 'p1', name: 'Program' }] }),
    ),
    http.get(origin + '/v1/program/departments', () =>
      HttpResponse.json({ departments: [{ department_id: 'd1', display_name: 'Saha' }] }),
    ),
    http.get(origin + '/v1/audit/entries', ({ request }) => {
      const url = new URL(request.url)
      auditRequests.push(url)
      const cursor = url.searchParams.get('cursor')
      return HttpResponse.json({
        entries: [cursor ? { ...entry, entry_id: 'event-2', target_name: 'İkinci görev' } : entry],
        next_cursor: cursor ? null : 'opaque_cursor',
      })
    }),
    http.get(origin + '/v1/audit/summary', ({ request }) => {
      auditRequests.push(new URL(request.url))
      return HttpResponse.json({
        total_all: 5,
        total_matched: 2,
        facets: { actor: [], action: [], category: [], department: [], range: [] },
        activity_30d: [{ date: '2026-11-02', total: 2, by_category: { task: 2 } }],
      })
    }),
    http.get(origin + '/v1/audit/action-types', () => HttpResponse.json({ items: [] })),
  )
  const pinia = createPinia()
  const store = useScopeStore(pinia)
  if (opts.selected)
    store.commit({
      programId: 'p1',
      departmentId: opts.admin ? null : 'd1',
      lens: opts.admin ? 'admin' : 'member',
    })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/islem-gecmisi', component: AuditHistoryPage }],
  })
  await router.push('/islem-gecmisi?tur=task&tur=file&q=Ay%C5%9Fe')
  return mount(AuditHistoryPage, {
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient: client }]] },
  })
}

it.each([{ admin: true }, { selected: true }])(
  'yetki ve seçili program olmadan global audit çağrısı atmaz: %j',
  async (opts) => {
    const wrapper = await open(opts)
    await vi.waitFor(() => expect(wrapper.text()).toContain('erişilebilir bir program seçin'))
    expect(auditRequests).toHaveLength(0)
    expect(wrapper.find('table').exists()).toBe(false)
  },
)

it('üye olayları, opak imleç ve çoklu süzgeçler dardır; IP sızıntısı olmaz', async () => {
  const wrapper = await open({ selected: true, membership: true })
  await vi.waitFor(() => expect(wrapper.text()).toContain('Ölçüm görevi'))
  expect(wrapper.text()).toContain('Görev oluşturuldu')
  expect(wrapper.text()).toContain('Saha')
  expect(wrapper.text()).not.toContain('192.0.2.1')
  expect(wrapper.text()).not.toContain('saklanacak ham ayrıntı')
  expect(auditRequests.every((url) => url.searchParams.get('program_id') === 'p1')).toBe(true)
  expect(auditRequests[0]?.searchParams.getAll('category')).toEqual(['task', 'file'])
  const next = wrapper.findAll('button').find((button) => button.text() === 'Daha fazla göster')!
  await next.trigger('click')
  await vi.waitFor(() => expect(wrapper.text()).toContain('İkinci görev'))
  expect(
    auditRequests.find((url) => url.searchParams.get('cursor'))?.searchParams.get('cursor'),
  ).toBe('opaque_cursor')
})

it('şirket yöneticisi sözleşmedeki istemci ayrıntısını görebilir', async () => {
  const wrapper = await open({ selected: true, admin: true })
  await vi.waitFor(() => expect(wrapper.text()).toContain('Chrome · macOS · 192.0.2.1'))
})

it('CSV ve liste aynı çoklu filtreleri kullanır; kurulum saatinde bitiş günü dahil', () => {
  const values = auditFilters({
    from: '2026-03-29',
    to: '2026-03-29',
    tur: ['task', 'file'],
    yapan: ['person-1', 'system'],
  })
  const filters = queryAudit('p1', values, 'Europe/Berlin')
  expect(filters).toEqual({
    program_id: 'p1',
    from: '2026-03-28T23:00:00.000Z',
    to: '2026-03-29T22:00:00.000Z',
    category: ['task', 'file'],
    actor: ['person-1', 'system'],
  })
  const exportUrl = new URL(auditExportTarget(filters).path, origin)
  expect(exportUrl.searchParams.getAll('category')).toEqual(['task', 'file'])
  expect(exportUrl.searchParams.getAll('actor')).toEqual(['person-1', 'system'])
  expect(exportUrl.searchParams.has('cursor')).toBe(false)
})

it('CSV biletli indirme rol ve seçili süzgeçleri taşır ve satır tavanını gösterir', async () => {
  const wrapper = await open({ selected: true, membership: true })
  await vi.waitFor(() => expect(wrapper.text()).toContain('Ölçüm görevi'))
  let issued: URL | undefined
  server.use(
    http.post(origin + '/v1/download-tickets', async ({ request }) => {
      const body = (await request.json()) as { path: string }
      issued = new URL(body.path, origin)
      expect(request.headers.get('X-Nizamio-Program')).toBeNull()
      return HttpResponse.json(
        { ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: '2026-11-20T10:00:00Z' },
        { status: 201 },
      )
    }),
    http.get(origin + '/v1/downloads/tk_1', () =>
      HttpResponse.json(
        {
          code: 'audit.export_too_large',
          message: 'internal',
          request_id: 'r1',
        },
        { status: 422 },
      ),
    ),
  )
  const csv = wrapper.findAll('button').find((button) => button.text() === 'CSV indir')!
  await csv.trigger('click')
  await vi.waitFor(() => expect(wrapper.text()).toContain('10.000'))
  expect(issued?.pathname).toBe('/v1/audit/export')
  expect(issued?.searchParams.get('program_id')).toBe('p1')
  expect(issued?.searchParams.getAll('category')).toEqual(['task', 'file'])
  expect(issued?.searchParams.get('q')).toBe('Ayşe')
  expect(issued?.searchParams.has('cursor')).toBe(false)
  expect(wrapper.text()).not.toContain('internal')
})
