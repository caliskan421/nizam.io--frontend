import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia } from 'pinia'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18n } from '@/shared/i18n'
import { useScopeStore } from '@/shared/scope/store'

import TablesPage from './TablesPage.vue'

const server = setupServer()
const origin = 'http://localhost'
const mounted: Array<{ wrapper: VueWrapper; client: QueryClient }> = []
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  for (const { wrapper, client } of mounted.splice(0)) {
    wrapper.unmount()
    client.clear()
  }
  server.resetHandlers()
})

async function render(url = '/tablolar', programId: string | null = 'p1') {
  const pinia = createPinia()
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })
  const scope = useScopeStore(pinia)
  scope.commit({ programId, lens: 'admin', departmentId: null })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { name: 'tables.list', path: '/tablolar', component: TablesPage },
      { name: 'tables.detail', path: '/tablolar/:tableId', component: TablesPage },
    ],
  })
  await router.push(url)
  const wrapper = mount(TablesPage, {
    global: { plugins: [pinia, i18n, router, [VueQueryPlugin, { queryClient: client }]] },
  })
  mounted.push({ wrapper, client })
  return { wrapper, scope, router }
}

function table(id: string, name: string) {
  return {
    id,
    name,
    owner_id: 'owner',
    schema_version: 1,
    sequence: 0,
    program_id: 'p1',
    department_id: null,
    space: 'personal',
  }
}

it('kişisel liste yalnız program başlığını taşır; opak imleç ile devam eder', async () => {
  const requests: Array<[string | null, string | null, string | null]> = []
  server.use(
    http.get(origin + '/v1/personal/tables', ({ request }) => {
      const cursor = new URL(request.url).searchParams.get('cursor')
      requests.push([
        request.headers.get('X-Nizamio-Program'),
        request.headers.get('X-Nizamio-Department'),
        cursor,
      ])
      return HttpResponse.json(
        cursor === null
          ? { items: [table('t1', 'Birinci')], next_cursor: 'opak/+?' }
          : { items: [table('t2', 'İkinci')] },
      )
    }),
  )
  const { wrapper } = await render()
  await vi.waitFor(() => expect(wrapper.text()).toContain('Birinci'))
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Daha fazla tablo')!
    .trigger('click')
  await vi.waitFor(() => expect(wrapper.text()).toContain('İkinci'))
  expect(requests).toEqual([
    ['p1', null, null],
    ['p1', null, 'opak/+?'],
  ])
})

it('koordinatörlük seçilmeden tablo isteği göndermez; eski birim cevabı yeni birime taşınmaz', async () => {
  let finishOld: (() => void) | undefined
  const old = new Promise<void>((resolve) => {
    finishOld = resolve
  })
  const requests: Array<[string | null, string | null]> = []
  server.use(
    http.get(origin + '/v1/program/departments', () =>
      HttpResponse.json({
        departments: [
          { department_id: 'd1', display_name: 'Birim 1' },
          { department_id: 'd2', display_name: 'Birim 2' },
        ],
      }),
    ),
    http.get(origin + '/v1/tables', async ({ request }) => {
      const department = request.headers.get('X-Nizamio-Department')
      requests.push([request.headers.get('X-Nizamio-Program'), department])
      if (department === 'd1') await old
      return HttpResponse.json({
        items: [table(department!, department === 'd1' ? 'Eski kapsam' : 'Yeni kapsam')],
      })
    }),
  )
  const { wrapper } = await render('/tablolar?alan=birim')
  await vi.waitFor(() => expect(wrapper.findAll('option')).toHaveLength(3))
  expect(requests).toEqual([])
  await wrapper.get('select').setValue('d1')
  await vi.waitFor(() => expect(requests).toEqual([['p1', 'd1']]))
  await wrapper.get('select').setValue('d2')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Yeni kapsam'))
  finishOld?.()
  await vi.waitFor(() =>
    expect(requests).toEqual([
      ['p1', 'd1'],
      ['p1', 'd2'],
    ]),
  )
  expect(wrapper.text()).not.toContain('Eski kapsam')
})

it('boş tablo oluşturur ve yalnız gerçek makbuz kimliğiyle salt okunur detay açar', async () => {
  let writes = 0
  server.use(
    http.get(origin + '/v1/personal/tables', () => HttpResponse.json({ items: [] })),
    http.post(origin + '/v1/personal/tables', async ({ request }) => {
      writes += 1
      expect(request.headers.get('Idempotency-Key')).toMatch(/^[A-Za-z0-9_-]{22}$/)
      expect(request.headers.get('X-Requested-With')).toBeTruthy()
      expect(await request.json()).toEqual({ name: 'Yeni Varış' })
      return HttpResponse.json(
        { table_id: 'from-server', sequence: 0, schema_version: 1, replayed: false },
        { status: 201 },
      )
    }),
    http.get(origin + '/v1/personal/tables/from-server', () =>
      HttpResponse.json({
        table: table('from-server', 'Yeni Varış'),
        rows: [],
        columns: [],
        cells: [],
      }),
    ),
  )
  const { wrapper, router } = await render()
  await vi.waitFor(() => expect(wrapper.text()).toContain('Henüz tablo yok'))
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Yeni tablo')!
    .trigger('click')
  await wrapper.get('input').setValue(' Yeni Varış ')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Salt okunur'))
  expect(router.currentRoute.value.path).toBe('/tablolar/from-server')
  expect(wrapper.get('h1').text()).toBe('Yeni Varış')
  expect(writes).toBe(1)
})

it('başlıkla birlikte tam ondalık ve yalnız erişilebilir referans adlarını gösterir', async () => {
  server.use(
    http.get(origin + '/v1/personal/tables/example', () =>
      HttpResponse.text(
        '{"table":{"id":"example","name":"Vardiya"},"rows":[{"id":"r"}],"columns":' +
          '[{"id":"n","name":"Sayı","type":"number"},{"id":"g","name":"Görev","type":"task_reference"}],' +
          '"cells":[{"row_id":"r","column_id":"n","value":9007199254740993.50},' +
          '{"row_id":"r","column_id":"g","value":["visible",null],"redacted":true}],"references":{"tasks":{"visible":"Kurulum","secret":"Gizli"}}}',
      ),
    ),
  )
  const { wrapper } = await render('/tablolar/example')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Kurulum'))
  expect(wrapper.text()).toContain('9007199254740993.50')
  expect(wrapper.text()).toContain('Erişilemeyen bağlantı')
  expect(wrapper.text()).not.toContain('Gizli')
  expect(wrapper.text()).not.toContain('visible')
})

it('404 ayrıntı cevabı kimliği veya eski tablo bağlamını göstermeden güvenli durumu açar', async () => {
  server.use(
    http.get(origin + '/v1/personal/tables/secret-id', () =>
      HttpResponse.json({ code: 'tables.not_found', message: 'secret-id' }, { status: 404 }),
    ),
  )
  const { wrapper } = await render('/tablolar/secret-id')
  await vi.waitFor(() => expect(wrapper.text()).toContain('erişiminiz değişmiş olabilir'))
  expect(wrapper.text()).not.toContain('secret-id')
})

it('belirsiz oluşturma sonucunda yalnız açık kullanıcı tekrarı aynı anahtarı ve gövdeyi taşır', async () => {
  const requests: Array<{ key: string | null; body: unknown }> = []
  server.use(
    http.get(origin + '/v1/personal/tables', () => HttpResponse.json({ items: [] })),
    http.post(origin + '/v1/personal/tables', async ({ request }) => {
      requests.push({ key: request.headers.get('Idempotency-Key'), body: await request.json() })
      if (requests.length === 1) return HttpResponse.error()
      return HttpResponse.json({
        table_id: 'retry-table',
        sequence: 0,
        schema_version: 1,
        replayed: true,
      })
    }),
    http.get(origin + '/v1/personal/tables/retry-table', () =>
      HttpResponse.json({
        table: table('retry-table', 'Aynı tablo'),
        rows: [],
        columns: [],
        cells: [],
      }),
    ),
  )
  const { router, wrapper } = await render()
  await vi.waitFor(() => expect(wrapper.text()).toContain('Yeni tablo'))
  await wrapper.get('#tables-create-trigger').trigger('click')
  await wrapper.get('input').setValue('Aynı tablo')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Aynı isteği gönder'))
  expect(requests).toHaveLength(1)
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Aynı isteği gönder')!
    .trigger('click')
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/tablolar/retry-table'))
  expect(requests).toHaveLength(2)
  expect(requests[0]).toEqual(requests[1])
})
