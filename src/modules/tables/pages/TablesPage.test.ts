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
      const params = new URL(request.url).searchParams
      if (params.get('template') === 'true') return HttpResponse.json({ items: [] })
      const cursor = params.get('cursor')
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
      if (new URL(request.url).searchParams.get('template') === 'true')
        return HttpResponse.json({ items: [] })
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

it('belirsiz oluşturma çakışırsa eski form kilitli kalır ve yeni oluşturma öncesi liste taze okunur', async () => {
  const writes: Array<{ key: string | null; body: unknown }> = []
  let reads = 0
  let listAvailable = true
  server.use(
    http.get(origin + '/v1/personal/tables', ({ request }) => {
      if (new URL(request.url).searchParams.get('template') === 'true')
        return HttpResponse.json({ items: [] })
      reads += 1
      if (!listAvailable)
        return HttpResponse.json({ code: 'platform.unavailable' }, { status: 503 })
      const items = writes.length ? [table('original', 'İlk tablo')] : []
      return HttpResponse.json({ items })
    }),
    http.post(origin + '/v1/personal/tables', async ({ request }) => {
      writes.push({ key: request.headers.get('Idempotency-Key'), body: await request.json() })
      return writes.length === 1
        ? HttpResponse.error()
        : HttpResponse.json({ code: 'platform.conflict_retry' }, { status: 409 })
    }),
  )
  const { wrapper } = await render()
  const button = (label: string) => wrapper.findAll('button').find((item) => item.text() === label)
  await vi.waitFor(() => expect(button('Yeni tablo')).toBeDefined())
  await wrapper.get('#tables-create-trigger').trigger('click')
  await wrapper.get('input').setValue('İlk tablo')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(button('Aynı isteği gönder')).toBeDefined())
  await button('Aynı isteği gönder')!.trigger('click')
  await vi.waitFor(() => expect(writes).toHaveLength(3))
  await vi.waitFor(() =>
    expect(wrapper.text()).toContain('Yeni bir tablo oluşturmadan önce listeyi kontrol edin'),
  )
  expect(button('Aynı isteği gönder')).toBeUndefined()
  expect(writes[0]).toEqual(writes[1])
  expect(writes[1]).toEqual(writes[2])
  expect(button('Oluştur')).toBeUndefined()
  expect(wrapper.get('input').attributes()).toHaveProperty('disabled')
  await wrapper.get('form').trigger('submit')
  await wrapper.get('form').trigger('keydown', { key: 'Escape' })
  expect(writes).toHaveLength(3)
  expect(button('Yeni tablo')).toBeUndefined()

  listAvailable = false
  await button('Listeyi yenile ve dön')!.trigger('click')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Güncel liste okunamadı'))
  expect(button('Yeni tablo')).toBeUndefined()
  listAvailable = true
  const before = reads
  await button('Listeyi yenile ve dön')!.trigger('click')
  await vi.waitFor(() => expect(button('Yeni tablo')).toBeDefined())
  expect(reads).toBeGreaterThan(before)
  expect(wrapper.text()).toContain('İlk tablo')
  expect(wrapper.find('form').exists()).toBe(false)
  expect(writes).toHaveLength(3)
})

const normalList = origin + '/v1/personal/tables'
const personalCopy = origin + '/v1/personal/table-copies'
const firstTemplate = { ...table('tpl-1', 'Görünür şablon'), is_template: true }
const laterTemplate = { ...table('tpl-2', 'Sonraki şablon'), is_template: true }

function labeledButton(wrapper: VueWrapper, label: string) {
  return wrapper.findAll('button').find((button) => button.text() === label)
}

it('kişisel şablon imleci normal tablolardan ayrıdır ve yalnız yapı kopyası varsayılan adla açılır', async () => {
  const templateCursors: Array<string | null> = []
  const regularCursors: Array<string | null> = []
  server.use(
    http.get(normalList, ({ request }) => {
      const params = new URL(request.url).searchParams
      const cursor = params.get('cursor')
      expect(request.headers.get('X-Nizamio-Program')).toBe('p1')
      expect(request.headers.get('X-Nizamio-Department')).toBeNull()
      if (params.get('template') === 'true') {
        templateCursors.push(cursor)
        return HttpResponse.json(
          cursor
            ? { items: [laterTemplate] }
            : {
                items: [firstTemplate],
                next_cursor: 'template/+',
              },
        )
      }
      regularCursors.push(cursor)
      return HttpResponse.json({
        items: [table('unflagged', 'Normal tablo')],
        next_cursor: 'ordinary',
      })
    }),
    http.post(personalCopy, async ({ request }) => {
      expect(request.headers.get('X-Nizamio-Department')).toBeNull()
      expect(request.headers.get('X-Requested-With')).toBeTruthy()
      expect(request.headers.get('Idempotency-Key')).toMatch(/^[A-Za-z0-9_-]{22}$/)
      expect(await request.json()).toEqual({
        source_table_id: 'tpl-2',
        source_space: 'personal',
        mode: 'structure',
      })
      return HttpResponse.json({ table_id: 'new-copy', replayed: false }, { status: 201 })
    }),
    http.get(normalList + '/new-copy', () =>
      HttpResponse.json({
        table: table('new-copy', 'Sonraki şablon'),
        columns: [],
        rows: [],
        cells: [],
      }),
    ),
  )
  const { wrapper, router } = await render()
  await vi.waitFor(() => expect(wrapper.find('#tables-template-tpl-1').exists()).toBe(true))
  expect(wrapper.findAll('#tables-template-unflagged')).toHaveLength(0)
  await labeledButton(wrapper, 'Daha fazla şablon')!.trigger('click')
  await vi.waitFor(() => expect(wrapper.find('#tables-template-tpl-2').exists()).toBe(true))
  expect(templateCursors).toEqual([null, 'template/+'])
  expect(regularCursors).toEqual([null])
  await wrapper.get('#tables-template-tpl-2').trigger('click')
  expect(wrapper.get('form').text()).toContain('Yalnızca sütun yapısı alınır')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/tablolar/new-copy'))
})

it('birim şablonunda S3 başlığı ve gövdedeki kaynak departmanı aynı seçili birimi kullanır', async () => {
  const endpoint = origin + '/v1/tables'
  const source = { ...firstTemplate, department_id: 'd1', space: 'coordinatorship' }
  server.use(
    http.get(origin + '/v1/program/departments', () =>
      HttpResponse.json({
        departments: [{ department_id: 'd1', display_name: 'Operasyon' }],
      }),
    ),
    http.get(endpoint, ({ request }) => {
      expect(request.headers.get('X-Nizamio-Department')).toBe('d1')
      return HttpResponse.json({
        items: new URL(request.url).searchParams.has('template') ? [source] : [],
      })
    }),
    http.post(origin + '/v1/table-copies', async ({ request }) => {
      expect(request.headers.get('X-Nizamio-Program')).toBe('p1')
      expect(request.headers.get('X-Nizamio-Department')).toBe('d1')
      expect(await request.json()).toEqual({
        source_table_id: 'tpl-1',
        source_space: 'coordinatorship',
        source_department_id: 'd1',
        mode: 'structure',
        name: 'Birim kopyası',
      })
      return HttpResponse.json({ table_id: 'unit-copy', replayed: true })
    }),
    http.get(endpoint + '/unit-copy', () =>
      HttpResponse.json({
        table: { ...source, id: 'unit-copy', name: 'Birim kopyası', is_template: false },
        columns: [],
        rows: [],
        cells: [],
      }),
    ),
  )
  const { wrapper, router } = await render('/tablolar?alan=birim')
  await vi.waitFor(() => expect(wrapper.findAll('option')).toHaveLength(2))
  await wrapper.get('select').setValue('d1')
  await vi.waitFor(() => expect(wrapper.find('#tables-template-tpl-1').exists()).toBe(true))
  await wrapper.get('#tables-template-tpl-1').trigger('click')
  expect(wrapper.get('form').text()).toContain('Operasyon')
  await wrapper.get('form input').setValue('Birim kopyası')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() =>
    expect(router.currentRoute.value.fullPath).toBe('/tablolar/unit-copy?alan=birim'),
  )
})

it.each([403, 404])(
  'kayıp şablon %s ile güvenli biçimde gizlenir ve şablon listesi yenilenir',
  async (status) => {
    let available = true
    let templateReads = 0
    server.use(
      http.get(normalList, ({ request }) => {
        if (new URL(request.url).searchParams.has('template')) templateReads++
        return HttpResponse.json({ items: available ? [firstTemplate] : [] })
      }),
      http.post(personalCopy, () => {
        available = false
        return HttpResponse.json({ code: 'tables.not_found' }, { status })
      }),
    )
    const { wrapper } = await render()
    await vi.waitFor(() => expect(wrapper.find('#tables-template-tpl-1').exists()).toBe(true))
    await wrapper.get('#tables-template-tpl-1').trigger('click')
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Şablon artık kullanılamıyor'))
    await vi.waitFor(() => expect(templateReads).toBeGreaterThan(1))
    await vi.waitFor(() => expect(wrapper.text()).not.toContain('Görünür şablon'))
    expect(wrapper.find('form button[type=submit]').exists()).toBe(false)
  },
)

it('şablon kopyasının belirsiz tekrarı 409 ile sonuçlanınca yeni yazma açılmaz', async () => {
  const writes: Array<{ key: string | null; body: unknown }> = []
  let listReadable = true
  server.use(
    http.get(normalList, ({ request }) => {
      if (new URL(request.url).searchParams.has('template'))
        return HttpResponse.json({ items: [firstTemplate] })
      return listReadable
        ? HttpResponse.json({ items: [] })
        : HttpResponse.json({}, { status: 503 })
    }),
    http.post(personalCopy, async ({ request }) => {
      writes.push({ key: request.headers.get('Idempotency-Key'), body: await request.json() })
      return writes.length === 1
        ? HttpResponse.error()
        : HttpResponse.json({ code: 'platform.conflict_retry' }, { status: 409 })
    }),
  )
  const { wrapper } = await render()
  await vi.waitFor(() => expect(wrapper.find('#tables-template-tpl-1').exists()).toBe(true))
  await wrapper.get('#tables-template-tpl-1').trigger('click')
  await wrapper.get('form input').setValue('Aynı kopya')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(labeledButton(wrapper, 'Aynı isteği gönder')).toBeDefined())
  await labeledButton(wrapper, 'Aynı isteği gönder')!.trigger('click')
  await vi.waitFor(() =>
    expect(wrapper.text()).toContain('Yeni bir tablo oluşturmadan önce listeyi kontrol edin'),
  )
  expect(writes).toEqual([writes[0], writes[0], writes[0]])
  await wrapper.get('form').trigger('submit')
  expect(writes).toHaveLength(3)

  listReadable = false
  await labeledButton(wrapper, 'Listeyi yenile ve dön')!.trigger('click')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Güncel liste okunamadı'))
  expect(wrapper.get('#tables-template-tpl-1').attributes()).toHaveProperty('disabled')
  listReadable = true
  await labeledButton(wrapper, 'Listeyi yenile ve dön')!.trigger('click')
  await vi.waitFor(() => expect(wrapper.find('form').exists()).toBe(false))
  expect(writes).toHaveLength(3)
})

it('kapsam değişince geç kopya makbuzu yeni programda detay açmaz', async () => {
  let release: (() => void) | undefined
  let started = false
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  server.use(
    http.get(normalList, ({ request }) =>
      HttpResponse.json({
        items:
          request.headers.get('X-Nizamio-Program') === 'p1' &&
          new URL(request.url).searchParams.has('template')
            ? [firstTemplate]
            : [],
      }),
    ),
    http.post(personalCopy, async () => {
      started = true
      await pending
      return HttpResponse.json({ table_id: 'old-context-copy' }, { status: 201 })
    }),
  )
  const { wrapper, scope, router } = await render()
  await vi.waitFor(() => expect(wrapper.find('#tables-template-tpl-1').exists()).toBe(true))
  await wrapper.get('#tables-template-tpl-1').trigger('click')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(started).toBe(true))
  scope.commit({ programId: 'p2', lens: 'admin', departmentId: null })
  await vi.waitFor(() => expect(wrapper.find('form').exists()).toBe(false))
  release?.()
  await vi.waitFor(() =>
    expect(wrapper.text()).toContain('Bu çalışma alanında erişilebilir şablon yok'),
  )
  expect(router.currentRoute.value.path).toBe('/tablolar')
})
