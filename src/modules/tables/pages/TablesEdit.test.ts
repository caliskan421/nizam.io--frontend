import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18n } from '@/shared/i18n'

import TablesDetail from './TablesDetail.vue'

const server = setupServer()
const endpoint = 'http://localhost/v1/personal/tables/t1'
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

async function render(departmentId: string | null = null) {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { name: 'tables.list', path: '/tablolar', component: TablesDetail },
      { name: 'tables.detail', path: '/tablolar/:tableId', component: TablesDetail },
    ],
  })
  await router.push('/tablolar/t1')
  const wrapper = mount(TablesDetail, {
    props: {
      target: { programId: 'p1', departmentId },
      tableId: 't1',
      unit: departmentId !== null,
    },
    global: { plugins: [i18n, router, [VueQueryPlugin, { queryClient: client }]] },
  })
  mounted.push({ wrapper, client })
  await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Vardiya'))
  return { client, router, wrapper }
}

const button = (wrapper: VueWrapper, label: string) =>
  wrapper.findAll('button').find((candidate) => candidate.text() === label)!

const column = { id: 'c1', name: 'Tutar', type: 'number', width: 160, multiple: false, position: 1 }
const row = { id: 'r1', position: 1 }
function snapshot(
  columns = [column],
  rows = [row],
  schema = 1,
  value: string | null = null,
  version = 0,
  role: 'owner' | 'editor' | 'viewer' | null = 'owner',
) {
  const table = {
    id: 't1',
    name: 'Vardiya',
    owner_id: 'owner',
    ...(role ? { effective_role: role } : {}),
    schema_version: schema,
    sequence: version,
    program_id: 'p1',
    space: 'personal',
    department_id: null,
  }
  const body = JSON.stringify({ table, columns, rows }).slice(0, -1)
  const cells =
    value === null
      ? '[]'
      : `[{"row_id":"r1","column_id":"c1","value":${value},"version":${version}}]`
  return HttpResponse.text(`${body},"cells":${cells}}`)
}

const writeResult = () =>
  HttpResponse.json({ table_id: 't1', sequence: 3, schema_version: 2, replayed: false })
const conflictResponse = (code: string) => HttpResponse.json({ code }, { status: 409 })

it('boş tabloya sütun ve satır ekleyip tam ondalık hücreyi gerçek komut gövdesiyle kaydeder', async () => {
  let columns: (typeof column)[] = []
  let rows: (typeof row)[] = []
  let cell: string | null = null
  const writes: string[] = []
  server.use(
    http.get(endpoint, () => snapshot(columns, rows, columns.length + 1, cell, 2)),
    http.post(endpoint + '/operations', async ({ request }) => {
      const body = await request.text()
      const command = JSON.parse(body) as { kind: string }
      writes.push(command.kind)
      expect(request.headers.get('X-Nizamio-Program')).toBe('p1')
      expect(request.headers.get('X-Nizamio-Department')).toBeNull()
      expect(request.headers.get('Idempotency-Key')).toMatch(/^[A-Za-z0-9_-]{22}$/)
      if (command.kind === 'add_column') {
        expect(command).toMatchObject({ name: 'Tutar', type: 'number', expected_schema: 1 })
        columns = [column]
      }
      if (command.kind === 'add_row') rows = [row]
      if (command.kind === 'set_cells') {
        expect(body).toContain('"version":0,"value":9007199254740993.50')
        cell = '9007199254740993.50'
      }
      return writeResult()
    }),
  )
  const { wrapper } = await render()
  await button(wrapper, 'Sütun ekle').trigger('click')
  await wrapper.get('input').setValue('Tutar')
  await wrapper.findAll('select').at(-1)!.setValue('number')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(wrapper.find('form').exists()).toBe(false))
  await button(wrapper, 'Satır ekle').trigger('click')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(wrapper.find('.tables-cell-button').exists()).toBe(true))
  await wrapper.get('.tables-cell-button').trigger('click')
  await wrapper.get('#table-cell-draft').setValue('9007199254740993,50')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() =>
    expect(wrapper.get('.tables-cell-button').text()).toBe('9007199254740993.50'),
  )
  expect(writes).toEqual(['add_column', 'add_row', 'set_cells'])
})

it('bayat hücre yazısı otomatik tekrar etmez, taze değer okunduktan sonra taslağı yeni sürümle uygular', async () => {
  let value = '12.20'
  let version = 1
  const writes: Array<{ key: string | null; body: string }> = []
  server.use(
    http.get(endpoint, () => snapshot([column], [row], 1, value, version)),
    http.post(endpoint + '/operations', async ({ request }) => {
      writes.push({ key: request.headers.get('Idempotency-Key'), body: await request.text() })
      if (writes.length === 1) {
        value = '42.10'
        version = 2
        return conflictResponse('tables.cell_conflict')
      }
      value = '22.50'
      version = 3
      return writeResult()
    }),
  )
  const { wrapper } = await render()
  await wrapper.get('.tables-cell-button').trigger('click')
  await wrapper.get('#table-cell-draft').setValue('22,50')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Düzenlemeniz bu ekranda duruyor'))
  expect(writes).toHaveLength(1)
  await button(wrapper, 'Güncel tabloyu oku').trigger('click')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Güncel değer: 42.10'))
  expect((wrapper.get('#table-cell-draft').element as HTMLInputElement).value).toBe('22,50')
  expect(writes).toHaveLength(1)
  await button(wrapper, 'Düzenlememi uygula').trigger('submit')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Hücre kaydedildi'))
  expect(writes[0]?.body).toContain('"version":1')
  expect(writes[1]?.body).toContain('"version":2,"value":22.50')
  expect(writes[0]?.key).not.toBe(writes[1]?.key)
})

it('Doğrulanmış editör için seçim yazma göndermez, gerçek 403 sonrasında yazma kapanır', async () => {
  const url = 'http://localhost/v1/tables/t1'
  let sent = 0
  server.use(
    http.get(url, () => snapshot([column], [row], 1, null, 0, 'editor')),
    http.post(url + '/operations', async ({ request }) => {
      sent += 1
      expect(request.headers.get('X-Nizamio-Department')).toBe('d1')
      expect(await request.json()).toEqual({ kind: 'add_row' })
      return HttpResponse.json({ code: 'tables.forbidden' }, { status: 403 })
    }),
  )
  const { wrapper } = await render('d1')
  await button(wrapper, 'Düzenlemek istiyorum').trigger('click')
  expect(sent).toBe(0)
  await button(wrapper, 'Satır ekle').trigger('click')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Düzenleme kapatıldı'))
  expect(sent).toBe(1)
  expect(wrapper.find('.tables-cell-button').exists()).toBe(false)
  expect(button(wrapper, 'Düzenlemek istiyorum')).toBeUndefined()
})

it('etkin rol yokken sahip kimliğinden yetki türetmez; yeniden okumada gelen rolü kullanır', async () => {
  let role: 'owner' | null = null
  server.use(http.get(endpoint, () => snapshot([column], [row], 1, null, 0, role)))
  const { wrapper } = await render()
  expect(wrapper.text()).toContain('Salt okunur')
  expect(button(wrapper, 'Sütun ekle')).toBeUndefined()
  expect(button(wrapper, 'Düzenlemek istiyorum')).toBeUndefined()
  role = 'owner'
  await button(wrapper, 'Erişimi yeniden kontrol et').trigger('click')
  await vi.waitFor(() => expect(button(wrapper, 'Sütun ekle')).toBeDefined())
})

it('viewer tablosunda yazma kontrollerini açmaz', async () => {
  server.use(http.get(endpoint, () => snapshot([column], [row], 1, null, 0, 'viewer')))
  const { wrapper } = await render()
  expect(wrapper.text()).toContain('Salt okunur')
  expect(button(wrapper, 'Sütun ekle')).toBeUndefined()
  expect(button(wrapper, 'Düzenlemek istiyorum')).toBeUndefined()
  expect(wrapper.find('.tables-cell-button').exists()).toBe(false)
})

it('yeniden okumada yazma rolü kaybolduğunda açık düzenleyiciyi kapatır', async () => {
  let role: 'editor' | 'viewer' = 'editor'
  server.use(http.get(endpoint, () => snapshot([column], [row], 1, null, 0, role)))
  const { client, wrapper } = await render()
  await button(wrapper, 'Düzenlemek istiyorum').trigger('click')
  await button(wrapper, 'Satır ekle').trigger('click')
  expect(wrapper.find('form').exists()).toBe(true)
  role = 'viewer'
  await client.invalidateQueries()
  await vi.waitFor(() => expect(wrapper.find('form').exists()).toBe(false))
  expect(wrapper.text()).toContain('Salt okunur')
  expect(button(wrapper, 'Düzenlemek istiyorum')).toBeUndefined()
})

it('şema çakışması sütun adını korur ve ikinci kullanıcı onayı taze expected_schema gönderir', async () => {
  let schema = 1
  const writes: unknown[] = []
  server.use(
    http.get(endpoint, () => snapshot([], [], schema)),
    http.post(endpoint + '/operations', async ({ request }) => {
      writes.push(await request.json())
      if (writes.length === 1) {
        schema = 2
        return conflictResponse('tables.schema_conflict')
      }
      return writeResult()
    }),
  )
  const { wrapper } = await render()
  await button(wrapper, 'Sütun ekle').trigger('click')
  await wrapper.get('input').setValue('Görev')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Düzenlemeniz bu ekranda duruyor'))
  expect(writes).toHaveLength(1)
  await button(wrapper, 'Güncel tabloyu oku').trigger('click')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Seçiminizi gözden geçirip'))
  expect((wrapper.get('input').element as HTMLInputElement).value).toBe('Görev')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(wrapper.find('form').exists()).toBe(false))
  expect(writes).toMatchObject([
    { expected_schema: 1, name: 'Görev' },
    { expected_schema: 2, name: 'Görev' },
  ])
})

it('tablo sahibinin silme onayı tek komut gönderip listeye döner', async () => {
  let sends = 0
  server.use(
    http.get(endpoint, () => snapshot()),
    http.post(endpoint + '/operations', async ({ request }) => {
      sends += 1
      expect(await request.json()).toEqual({ kind: 'delete_table' })
      return writeResult()
    }),
  )
  const { wrapper, router } = await render()
  await button(wrapper, 'Tabloyu düzenle').trigger('click')
  await wrapper.get('select').setValue('delete_table')
  await wrapper.get('form').trigger('submit')
  expect(sends).toBe(0)
  expect(wrapper.text()).toContain('Tablo listeden kalkar')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/tablolar'))
  expect(sends).toBe(1)
})

it('bağlantı koptuğunda aynı hücreyi aynı anahtarla yalnız açık kullanıcı eylemi tekrar gönderir', async () => {
  const writes: Array<{ key: string | null; body: string }> = []
  server.use(
    http.get(endpoint, () => snapshot([column], [row], 1, '1', 1)),
    http.post(endpoint + '/operations', async ({ request }) => {
      writes.push({ key: request.headers.get('Idempotency-Key'), body: await request.text() })
      return writes.length === 1 ? HttpResponse.error() : writeResult()
    }),
  )
  const { wrapper } = await render()
  await wrapper.get('.tables-cell-button').trigger('click')
  await wrapper.get('#table-cell-draft').setValue('123,4500')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(button(wrapper, 'Aynı isteği gönder')).toBeDefined())
  expect(writes).toHaveLength(1)
  expect((wrapper.get('#table-cell-draft').element as HTMLInputElement).value).toBe('123,4500')
  await button(wrapper, 'Aynı isteği gönder').trigger('click')
  await vi.waitFor(() => expect(wrapper.text()).toContain('Hücre kaydedildi'))
  expect(writes).toHaveLength(2)
  expect(writes[1]).toEqual(writes[0])
})

it('kayıplı dönüşümde sadece sunucunun hücre sayısını gösterir, dönüşümü yinelemez', async () => {
  const textColumn = { ...column, type: 'text' }
  let sends = 0
  server.use(
    http.get(endpoint, () => snapshot([textColumn], [row], 1, '"Hazır değil"', 1)),
    http.post(endpoint + '/operations', async ({ request }) => {
      sends += 1
      expect(await request.json()).toEqual({
        kind: 'convert_column',
        id: 'c1',
        type: 'number',
        expected_schema: 1,
      })
      return HttpResponse.json(
        {
          code: 'tables.conversion_lossy',
          fields: [{ field: 'lossy_cells', code: 'tables.conversion_lossy', message: '2' }],
        },
        { status: 409 },
      )
    }),
  )
  const { wrapper } = await render()
  await button(wrapper, 'Tabloyu düzenle').trigger('click')
  await wrapper.get('select').setValue('convert_column')
  await wrapper.findAll('select')[1]!.setValue('c1')
  await wrapper.get('form').trigger('submit')
  expect(sends).toBe(0)
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(wrapper.text()).toContain('2 hücre yeni tipe dönüştürülemedi'))
  expect(sends).toBe(1)
  expect(wrapper.text()).toContain('Hazır değil')
})

it('sonucu belirsiz satır ekleme tekrarı çakıştığında aynı anahtarı korur ve yeni eylemi kilitler', async () => {
  const writes: Array<{ key: string | null; body: unknown }> = []
  server.use(
    http.get(endpoint, () => snapshot()),
    http.post(endpoint + '/operations', async ({ request }) => {
      writes.push({ key: request.headers.get('Idempotency-Key'), body: await request.json() })
      return writes.length === 1
        ? HttpResponse.error()
        : conflictResponse('platform.conflict_retry')
    }),
  )
  const { wrapper } = await render()
  await button(wrapper, 'Satır ekle').trigger('click')
  await wrapper.get('form').trigger('submit')
  await vi.waitFor(() => expect(button(wrapper, 'Aynı isteği gönder')).toBeDefined())
  await button(wrapper, 'Aynı isteği gönder').trigger('click')
  await vi.waitFor(() => expect(writes).toHaveLength(3))
  await vi.waitFor(() => expect(button(wrapper, 'Aynı isteği gönder')).toBeUndefined())
  expect(writes[0]).toEqual(writes[1])
  expect(writes[1]).toEqual(writes[2])
  expect(wrapper.text()).toContain('İlk isteğin sonucu doğrulanamadı.')
  expect(wrapper.get('form button[type="submit"]').attributes()).toHaveProperty('disabled')
  expect(button(wrapper, 'Kapat').attributes()).toHaveProperty('disabled')
  await wrapper.get('form').trigger('submit')
  expect(writes).toHaveLength(3)
  await button(wrapper, 'Güncel tabloyu oku').trigger('click')
  await vi.waitFor(() =>
    expect(button(wrapper, 'Kapat').attributes()).not.toHaveProperty('disabled'),
  )
  expect(wrapper.get('form button[type="submit"]').attributes()).toHaveProperty('disabled')
})

it('yarım tarih girdisini boş hücre olarak kaydetmez', async () => {
  const dateColumn = { ...column, type: 'date' }
  const post = vi.fn(() => writeResult())
  server.use(
    http.get(endpoint, () => snapshot([dateColumn], [row], 1, '"2026-11-19"', 1)),
    http.post(endpoint + '/operations', post),
  )
  const { wrapper } = await render()
  await wrapper.get('.tables-cell-button').trigger('click')
  const date = wrapper.get<HTMLInputElement>('#table-cell-draft')
  await date.setValue('')
  Object.defineProperty(date.element.validity, 'badInput', { configurable: true, value: true })
  await wrapper.get('form').trigger('submit')
  expect(wrapper.text()).toContain('Tarihi tamamlayın')
  expect(post).not.toHaveBeenCalled()
})

it('satırlar yeniden sıralanınca açık silme onayını düşürür ve seçili kaydın yeni etiketini gösterir', async () => {
  let rows = [row, { id: 'r2', position: 2 }]
  const post = vi.fn(() => writeResult())
  server.use(
    http.get(endpoint, () => snapshot([column], rows, 1, '15.42', 1)),
    http.post(endpoint + '/operations', post),
  )
  const { client, wrapper } = await render()
  await button(wrapper, 'Tabloyu düzenle').trigger('click')
  await wrapper.get('select').setValue('delete_row')
  await wrapper.findAll('select')[1]!.setValue('r1')
  await wrapper.get('form').trigger('submit')
  expect(wrapper.text()).toContain('1. satır · 15.42 silinecek')
  rows = [...rows].reverse()
  await client.invalidateQueries()
  await vi.waitFor(() => expect(button(wrapper, 'Onayla')).toBeUndefined())
  await wrapper.get('form').trigger('submit')
  expect(wrapper.text()).toContain('2. satır · 15.42 silinecek')
  expect(post).not.toHaveBeenCalled()
})
