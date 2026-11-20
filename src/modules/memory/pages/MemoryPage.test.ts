import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia } from 'pinia'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18n } from '@/shared/i18n'
import { useScopeStore } from '@/shared/scope/store'

import type { ExperienceDetail } from '../model/types'
import MemoryPage from './MemoryPage.vue'

vi.mock('@/shared/scope/standing', () => ({
  useStanding: () => ({
    status: ref('ready'),
    programs: ref([]),
    standing: ref({
      accountId: 'u1',
      companyAdmin: false,
      rows: [{ programId: 'p1', departmentId: 'd1', role: 'member' }],
    }),
  }),
}))

const root = 'http://localhost/v1'
const server = setupServer()
let wrapper: VueWrapper | undefined
let client: QueryClient | undefined

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  wrapper?.unmount()
  client?.clear()
  server.resetHandlers()
})

const record: ExperienceDetail = {
  id: 'e1',
  area: 'energy',
  author: { account_id: 'u1', full_name: 'Ayşe' },
  can: {
    convert: false,
    delete: false,
    edit_area: false,
    edit_suggestion: true,
    edit_title: false,
    manage: false,
  },
  converted_work_item: null,
  created_at: '2026-11-19T12:00:00Z',
  updated_at: '2026-11-19T12:00:00Z',
  department: { id: 'd1', code: null, name: 'Enerji' },
  endorsed_by_me: false,
  endorsement_count: 0,
  event: { program_id: 'p0', label: 'Geçmiş sezon' },
  has_source: true,
  impact: 'Gecikme',
  revision: 1,
  status: 'open',
  suggestion: null,
  title: 'Jeneratör deneyimi',
  endorsements: [],
  source: { accessible: false, id: null, label: null, kind: 'work_note' },
}
const facets = {
  total: 5,
  by_status: { open: 5 },
  by_area: { energy: 5 },
  by_event: [{ count: 5, label: 'Geçmiş sezon', program_id: 'p0' }],
}

async function setup(path = '/kurumsal-hafiza') {
  const pinia = createPinia()
  useScopeStore(pinia).commit({ programId: 'p1', departmentId: 'd1', lens: 'member' })
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { name: 'memory', path: '/kurumsal-hafiza', component: MemoryPage },
      { name: 'work.tasks', path: '/gorevler', component: { render: () => null } },
      {
        name: 'collaboration.meeting',
        path: '/toplantilar/:meetingId',
        component: { render: () => null },
      },
    ],
  })
  await router.push(path)
  wrapper = mount(MemoryPage, {
    global: { plugins: [pinia, router, i18n, [VueQueryPlugin, { queryClient: client }]] },
  })
  return wrapper
}

function button(view: VueWrapper, label: string) {
  return view.findAll('button').find((item) => item.text().startsWith(label))!
}

it('şirket deneyimini ayrı, yalnız seçili programın görünür notlarını ayrı okur', async () => {
  const paths: string[] = []
  const read = (request: Request) => {
    expect(request.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(request.headers.get('X-Nizamio-Department')).toBeNull()
    paths.push(new URL(request.url).pathname)
  }
  server.use(
    http.get(root + '/memory/experiences', ({ request }) => {
      read(request)
      return HttpResponse.json({ items: [record], facets, next_cursor: null })
    }),
    http.get(root + '/memory/experiences/e1', ({ request }) => {
      read(request)
      return HttpResponse.json(record)
    }),
    http.get(root + '/work-item-notes', ({ request }) => {
      read(request)
      return HttpResponse.json({
        items: [
          {
            id: 'n1',
            author_account_id: 'u1',
            author_full_name: 'Ayşe',
            content: 'Görünür görev notu',
            created_at: record.created_at,
            flag: null,
            shared: false,
            work_item: { code: null, department_id: 'd1', id: 'w1', title: 'Görev' },
          },
        ],
        total: 1,
        total_capped: false,
      })
    }),
    http.get(root + '/meeting-notes', ({ request }) => {
      read(request)
      return HttpResponse.json({ items: [], total: 0, total_capped: false })
    }),
    http.get(root + '/memory/experiences/by-source', ({ request }) => {
      read(request)
      return HttpResponse.json({ items: { n1: 'e1' } })
    }),
  )
  const view = await setup()
  await vi.waitFor(() => expect(view.text()).toContain('Geçmiş sezon'))
  expect(view.text()).toContain('Tümü (5)')
  expect(paths).toEqual(['/v1/memory/experiences'])
  await view.get('.memory-record').trigger('click')
  await vi.waitFor(() => expect(view.text()).toContain('Ben de yaşadım'))
  expect(view.text()).not.toContain('Deneyimi sil')
  expect(view.text()).not.toContain('Kaynak not')
  await button(view, 'Tüm notlar').trigger('click')
  await vi.waitFor(() => expect(view.text()).toContain('Hafızada'))
  expect(view.text()).toContain('Görünür görev notu')
  expect(paths).toEqual(
    expect.arrayContaining([
      '/v1/work-item-notes',
      '/v1/meeting-notes',
      '/v1/memory/experiences/by-source',
    ]),
  )
  await button(view, 'Hafızada').trigger('click')
  await vi.waitFor(() => expect(view.text()).toContain('Ben de yaşadım'))
})

it('sürüm çakışmasında kullanıcı önerisini korur ve ancak onay sonrası yeni sürümle yazar', async () => {
  let revision = 1
  const writes: unknown[] = []
  const current = () => ({
    ...record,
    revision,
    can: { ...record.can, edit_title: true, edit_area: true },
    ...(revision === 2 ? { title: 'Güncel başlık', impact: 'Güncel etki', area: 'supply' } : {}),
  })
  server.use(
    http.get(root + '/memory/experiences', () =>
      HttpResponse.json({ items: [], facets, next_cursor: null }),
    ),
    http.get(root + '/memory/experiences/e1', () => HttpResponse.json(current())),
    http.patch(root + '/memory/experiences/e1', async ({ request }) => {
      writes.push(await request.json())
      if (revision === 1) {
        revision = 2
        return HttpResponse.json({ code: 'memory.revision_conflict' }, { status: 409 })
      }
      return HttpResponse.json(current())
    }),
  )
  const view = await setup('/kurumsal-hafiza?deneyim=e1')
  await vi.waitFor(() => expect(view.text()).toContain('Deneyimi düzenle'))
  await button(view, 'Deneyimi düzenle').trigger('click')
  await view.get('textarea[name=suggestion]').setValue('Kullanıcının önerisi')
  await view.get('aside form').trigger('submit')
  await vi.waitFor(() => expect(view.text()).toContain('Güncel sürümü kullan'))
  expect(view.get<HTMLTextAreaElement>('textarea[name=suggestion]').element.value).toBe(
    'Kullanıcının önerisi',
  )
  expect(writes).toHaveLength(1)
  expect(view.text()).toContain('Güncel etki')
  await button(view, 'Güncel sürümü kullan').trigger('click')
  await view.get('aside form').trigger('submit')
  await vi.waitFor(() =>
    expect(writes).toEqual([
      { expected_revision: 1, suggestion: 'Kullanıcının önerisi' },
      { expected_revision: 2, suggestion: 'Kullanıcının önerisi' },
    ]),
  )
})
