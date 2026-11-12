import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18n } from '@/shared/i18n'
import { settleQueries } from '@/shared/http/__tests__/settle'

import {
  ADMIN,
  COORD,
  folder,
  harness,
  http,
  json,
  MEMBER,
  ORIGIN,
  resetHarness,
  s3Requests,
  sent,
  server,
  standing,
} from '../model/__tests__/harness'
import ArchivePage from './ArchivePage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
const mounted: Array<{ unmount: () => void }> = []
afterEach(() => {
  for (const w of mounted.splice(0)) w.unmount()
  resetHarness()
})
afterAll(() => server.close())

it('sayfa bildirimi gövdeden bağımsız: prop/emit yok (KESİN 22)', () => {
  expect(Object.keys(ArchivePage.props ?? {})).toEqual([])
  expect(ArchivePage.emits ?? []).toEqual([])
})

const departments = (...rows: Array<[string, string]>) =>
  http.get(`${ORIGIN}/v1/program/departments`, () =>
    json({ departments: rows.map(([id, name]) => ({ department_id: id, display_name: name })) }),
  )
const folders = (...items: object[]) =>
  http.get(`${ORIGIN}/v1/records/archive/folders`, () => json({ folders: items }))
const tasks = (...items: Array<{ id: string; title: string }>) =>
  http.get(`${ORIGIN}/v1/records/archive/tasks`, () =>
    json({ tasks: items.map((t) => ({ work_item_id: t.id, title: t.title, file_count: 1 })) }),
  )

async function mountPage(selection: Parameters<typeof harness>[0], url = '/arsiv') {
  const h = harness(selection)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/arsiv', name: 'archive.folders', component: ArchivePage },
      { path: '/arsiv/:klasorId', name: 'archive.folder', component: { template: '<i />' } },
    ],
  })
  await router.push(url)
  await router.isReady()
  const wrapper = mount(ArchivePage, {
    global: {
      plugins: [getActivePinia()!, i18n, router, [VueQueryPlugin, { queryClient: h.queryClient }]],
      stubs: { PeriodZipButton: true, UploadDialog: true },
    },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  await settleQueries(h.queryClient)
  await flushPromises()
  return { h, router, wrapper }
}

const names = (w: { findAll: (s: string) => Array<{ text: () => string }> }) =>
  w.findAll('.archive-folder__name').map((n) => n.text())

describe('yönetici (P33)', () => {
  const adminHandlers = [
    ...standing({ admin: true }),
    departments(['d2', 'Zemin'], ['d1', 'Ağ'], ['d3', 'Bilişim']),
  ]

  it('başlık, P38 alt başlığı; koordinatörlük adları S2’den, sayılar —, S3 isteği YOK', async () => {
    server.use(...adminHandlers)
    const { wrapper } = await mountPage(ADMIN)
    expect(wrapper.get('h1').text()).toBe('Arşiv')
    expect(wrapper.get('.rp-sub').text()).toBe('Görevlere yüklenen dosyalar')
    expect(wrapper.text()).not.toMatch(/Kurumsal hafıza/)
    expect(names(wrapper)).toEqual(['Ağ', 'Bilişim', 'Zemin'])
    expect(wrapper.findAll('[data-field="meta"]').map((n) => n.text())).toEqual(['—', '—', '—'])
    expect(wrapper.get('.archive-coords__count').text()).toBe('3')
    expect(s3Requests()).toHaveLength(0)
    expect(wrapper.text()).not.toMatch(/grup/i)
  })

  it('arama ve segment statik (BE-072) + "Görev klasörü seçin"; depolama yalnız —', async () => {
    server.use(...adminHandlers)
    const { wrapper } = await mountPage(ADMIN)
    expect(wrapper.get('input[type="search"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-design-stub="BE-072"] .rp-seg').exists()).toBe(true)
    expect(wrapper.get('.archive-searchbar [role="status"]').text()).toBe('Görev klasörü seçin')
    expect(wrapper.get('[data-field="files"]').text()).toBe('—')
  })

  it('"Tümünü indir" bağlı ve hedefsiz (null → devre dışı, BE-120); "Dosya yükle" devre dışı + BE-072', async () => {
    server.use(...adminHandlers)
    const { wrapper } = await mountPage(ADMIN)
    const zip = wrapper.findComponent({ name: 'PeriodZipButton' })
    expect(zip.exists()).toBe(true)
    expect(zip.props('target')).toBeNull()
    const upload = wrapper.get('[data-action="upload"]')
    expect(upload.attributes('disabled')).toBeDefined()
    expect(upload.attributes('title')).toBe('Yüklemek için önce bir koordinatörlük klasörü açın.')
    expect(wrapper.find('[data-design-stub="BE-072"] [data-action="upload"]').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'UploadDialog' }).exists()).toBe(false)
  })

  it('sirala URL’den okunur; geçersiz tur Tümü; sıra menüsü URL’yi yazar, varsayılan parametreyi kaldırır', async () => {
    server.use(...adminHandlers)
    const { wrapper, router } = await mountPage(ADMIN, '/arsiv?sirala=ad:azalan&tur=pdf')
    expect(names(wrapper)).toEqual(['Zemin', 'Bilişim', 'Ağ'])
    expect(wrapper.get('.rp-seg [aria-pressed="true"]').text()).toBe('Tümü')
    await wrapper.get('.archive-sort__btn').trigger('click')
    await wrapper.get('[data-sort="adArtan"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.sirala).toBeUndefined()
    expect(names(wrapper)).toEqual(['Ağ', 'Bilişim', 'Zemin'])
    await wrapper.get('.archive-sort__btn').trigger('click')
    await wrapper.get('[data-sort="adAzalan"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.sirala).toBe('ad:azalan')
  })

  it('kart tıklaması /arsiv/:klasorId’e götürür', async () => {
    server.use(...adminHandlers)
    const { wrapper, router } = await mountPage(ADMIN)
    await wrapper.get('[data-folder-id="d2"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/arsiv/d2')
  })

  it('13’ten fazla koordinatörlükte "N koordinatörlük daha"', async () => {
    server.use(
      ...standing({ admin: true }),
      departments(
        ...Array.from({ length: 14 }, (_, i): [string, string] => [`d${i}`, `Birim ${i + 10}`]),
      ),
    )
    const { wrapper } = await mountPage(ADMIN)
    expect(wrapper.findAll('.rp-folder')).toHaveLength(12)
    expect(wrapper.get('.archive-more').text()).toBe('2 koordinatörlük daha')
  })

  it('liste kesilmişse (X-Result-Truncated) ekran söyler', async () => {
    server.use(
      ...standing({ admin: true }),
      http.get(
        `${ORIGIN}/v1/program/departments`,
        () =>
          new Response(
            JSON.stringify({ departments: [{ department_id: 'd1', display_name: 'Ağ' }] }),
            {
              headers: { 'Content-Type': 'application/json', 'X-Result-Truncated': 'true' },
            },
          ),
      ),
    )
    const { wrapper } = await mountPage(ADMIN)
    expect(wrapper.text()).toContain('Koordinatörlük listesi kesildi')
  })

  it('departman listesi yüklenemezse hata durumu; Yeniden dene yeniden okur', async () => {
    let fail = true
    server.use(
      ...standing({ admin: true }),
      http.get(`${ORIGIN}/v1/program/departments`, () =>
        fail
          ? json({ code: 'platform.internal', message: 'x', request_id: 'r', fields: [] }, 500)
          : json({ departments: [{ department_id: 'd1', display_name: 'Ağ' }] }),
      ),
    )
    const { wrapper, h } = await mountPage(ADMIN)
    expect(wrapper.text()).toContain('Koordinatörlükler yüklenemedi')
    fail = false
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Yeniden dene')!
      .trigger('click')
    await settleQueries(h.queryClient)
    await flushPromises()
    expect(names(wrapper)).toEqual(['Ağ'])
  })
})

describe('koordinatör / üye (P40)', () => {
  it('koordinatör /arsiv → kendi klasörü; arama metni taşınır; ızgara görünmez', async () => {
    server.use(
      ...standing({ rows: [['p1', 'd1', 'koordinator']] }),
      departments(),
      tasks(),
      folders(folder({ folder_id: 'd1' })),
    )
    const { wrapper, router } = await mountPage(COORD, '/arsiv?q=rapor')
    expect(router.currentRoute.value.path).toBe('/arsiv/d1')
    expect(router.currentRoute.value.query.q).toBe('rapor')
    expect(wrapper.find('.archive-grid').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'PeriodZipButton' }).exists()).toBe(false)
  })

  it('üye /arsiv → sanal klasör my-tasks', async () => {
    server.use(
      ...standing({ rows: [['p1', 'd1', 'uye']] }),
      departments(),
      tasks(),
      folders(folder({ folder_id: 'my-tasks', name: 'Görevlerim', is_virtual: true })),
    )
    const { router } = await mountPage(MEMBER)
    expect(router.currentRoute.value.path).toBe('/arsiv/my-tasks')
    expect(sent('GET', '/v1/records/archive/folders')[0]!.headers.get('X-Nizamio-Department')).toBe(
      'd1',
    )
  })

  it('klasör listesi gelene dek yönlendirme yok; boş listede boş durum (yönlendirilecek klasör yok)', async () => {
    server.use(
      ...standing({ rows: [['p1', 'd1', 'koordinator']] }),
      departments(),
      tasks(),
      folders(),
    )
    const { wrapper, router } = await mountPage(COORD)
    expect(router.currentRoute.value.path).toBe('/arsiv')
    expect(wrapper.text()).toContain('Görüntülenecek klasör yok')
  })

  it('klasör listesi hatası: hata durumu, Yeniden dene sonra yönlendirir', async () => {
    let fail = true
    server.use(
      ...standing({ rows: [['p1', 'd1', 'koordinator']] }),
      departments(),
      tasks(),
      http.get(`${ORIGIN}/v1/records/archive/folders`, () =>
        fail
          ? json({ code: 'platform.internal', message: 'x', request_id: 'r', fields: [] }, 500)
          : json({ folders: [folder({ folder_id: 'd1' })] }),
      ),
    )
    const { wrapper, router, h } = await mountPage(COORD)
    expect(wrapper.text()).toContain('Koordinatörlükler yüklenemedi')
    fail = false
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Yeniden dene')!
      .trigger('click')
    await settleQueries(h.queryClient)
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/arsiv/d1')
  })
})

describe('Dosya yükle (E-06-05; W125 bağlama noktası)', () => {
  const setup = () =>
    server.use(
      ...standing({ rows: [['p1', 'd1', 'koordinator']] }),
      departments(),
      folders(),
      tasks({ id: 'w2', title: 'Zeytin' }, { id: 'w1', title: 'Ağ planı' }),
    )

  it('tasks = uploadTasks (ada göre sıralı, S3 başlığındaki departman); düğme pencereyi açar', async () => {
    setup()
    const { wrapper } = await mountPage(COORD)
    const button = wrapper.get('[data-action="upload"]')
    expect(button.attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-design-stub]').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'UploadDialog' }).exists()).toBe(false)
    await button.trigger('click')
    const dialog = wrapper.findComponent({ name: 'UploadDialog' })
    expect(dialog.props('tasks')).toEqual([
      { workItemId: 'w1', title: 'Ağ planı', departmentId: 'd1' },
      { workItemId: 'w2', title: 'Zeytin', departmentId: 'd1' },
    ])
    dialog.vm.$emit('close')
    await flushPromises()
    expect(wrapper.findComponent({ name: 'UploadDialog' }).exists()).toBe(false)
  })

  it('kapsam değişince açık pencere kapanır', async () => {
    setup()
    const { wrapper, h } = await mountPage(COORD)
    await wrapper.get('[data-action="upload"]').trigger('click')
    expect(wrapper.findComponent({ name: 'UploadDialog' }).exists()).toBe(true)
    h.store.commit({ programId: 'p2', lens: 'coordinator', departmentId: 'd9' })
    await flushPromises()
    expect(wrapper.findComponent({ name: 'UploadDialog' }).exists()).toBe(false)
  })

  it('yüklenebilir görev yoksa düğme devre dışı ve nedenini söyler', async () => {
    server.use(
      ...standing({ rows: [['p1', 'd1', 'koordinator']] }),
      departments(),
      folders(),
      tasks(),
    )
    const { wrapper } = await mountPage(COORD)
    const button = wrapper.get('[data-action="upload"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('title')).toBe('Yüklenebilecek görev bulunamadı.')
  })
})
