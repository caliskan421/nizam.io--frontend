import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18n } from '@/shared/i18n'
import { settleQueries } from '@/shared/http/__tests__/settle'

import {
  ADMIN,
  archiveFile,
  COORD,
  folder,
  folderBody,
  harness,
  http,
  json,
  MEMBER,
  ORIGIN,
  resetHarness,
  s2Requests,
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

/** S2 `programArchiveFolders` (yönetici): kartlar + toplamlar. */
const programFolders = (...cards: Array<ReturnType<typeof folder>>) =>
  http.get(`${ORIGIN}/v1/program/archive/folders`, () => json(folderBody(...cards)))
const programTasks = (...items: Array<{ id: string; title: string; department: string }>) =>
  http.get(`${ORIGIN}/v1/program/archive/tasks`, () =>
    json({
      tasks: items.map((t) => ({
        work_item_id: t.id,
        title: t.title,
        department_id: t.department,
        file_count: 0,
      })),
    }),
  )
const programFiles = (...files: object[]) =>
  http.get(`${ORIGIN}/v1/program/archive/attachments`, () => json({ files, total: files.length }))
const folders = (...items: Array<ReturnType<typeof folder>>) =>
  http.get(`${ORIGIN}/v1/records/archive/folders`, () => json(folderBody(...items)))
const tasks = (...items: Array<{ id: string; title: string }>) =>
  http.get(`${ORIGIN}/v1/records/archive/tasks`, () =>
    json({
      tasks: items.map((t) => ({
        work_item_id: t.id,
        title: t.title,
        department_id: 'd1',
        file_count: 1,
      })),
    }),
  )

async function mountPage(selection: Parameters<typeof harness>[0], url = '/arsiv') {
  const h = harness(selection)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/arsiv', name: 'archive.folders', component: ArchivePage },
      { path: '/arsiv/:klasorId', name: 'archive.folder', component: { template: '<i />' } },
      // W138: 06 başlığındaki "Önizle" bağlantısının hedefi (rapor modülü rotası).
      { path: '/arsiv/donem-raporu', name: 'reports.season', component: { template: '<i />' } },
    ],
  })
  await router.push(url)
  await router.isReady()
  const wrapper = mount(ArchivePage, {
    global: {
      plugins: [getActivePinia()!, i18n, router, [VueQueryPlugin, { queryClient: h.queryClient }]],
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

describe('yönetici (S2, BE-072)', () => {
  const cards = [
    folder({ folder_id: 'd2', name: 'Zemin', file_count: 4, task_count: 2 }),
    folder({ folder_id: 'd1', name: 'Ağ', file_count: 0 }),
    folder({ folder_id: 'd3', name: 'Bilişim', file_count: 9, task_count: 3 }),
  ]
  const adminHandlers = [
    ...standing({ admin: true }),
    programFolders(...cards),
    programTasks({ id: 'w1', title: 'Boş görev', department: 'd1' }),
  ]

  it('başlık, P38 alt başlığı; kartlar programArchiveFolders sayılarıyla (—/statik yok), S3 isteği YOK', async () => {
    server.use(...adminHandlers)
    const { wrapper } = await mountPage(ADMIN)
    expect(wrapper.get('h1').text()).toBe('Arşiv')
    expect(wrapper.get('.rp-sub').text()).toBe('Görevlere yüklenen dosyalar')
    expect(wrapper.text()).not.toMatch(/Kurumsal hafıza/)
    expect(names(wrapper)).toEqual(['Ağ', 'Bilişim', 'Zemin'])
    expect(wrapper.findAll('[data-field="meta"]').map((n) => n.text())).toEqual([
      'Henüz dosya yok',
      '9 dosya · 3 görev',
      '4 dosya · 2 görev',
    ])
    expect(wrapper.get('.archive-coords__count').text()).toBe('3')
    expect(s3Requests()).toHaveLength(0)
    // Eski yol yok (P33 geçici yolu): departman adları için `listProgramDepartments` okunmaz.
    expect(sent('GET', '/v1/program/departments')).toHaveLength(0)
    for (const call of s2Requests()) {
      expect(call.headers.get('X-Nizamio-Department')).toBeNull()
    }
    expect(wrapper.text()).not.toMatch(/grup/i)
  })

  it('arama ve segment etkin (stub/"Görev klasörü seçin" yok); depolama toplamı sunucudan', async () => {
    server.use(...adminHandlers)
    const { wrapper } = await mountPage(ADMIN)
    expect(wrapper.get('input[type="search"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-design-stub="BE-072"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Görev klasörü seçin')
    expect(wrapper.get('[data-field="files"]').text()).toBe('13')
  })

  it('arama: program geneli programArchiveAttachments (department_id yok); sonuç listesi ızgaranın yerine gelir; sonuca tık dosyanın klasörünü açar', async () => {
    server.use(
      programTasks({ id: 'w9', title: 'Şartname', department: 'd2' }),
      ...adminHandlers,
      programFiles(
        archiveFile({
          file_id: 'f9',
          work_item_id: 'w9',
          department_id: 'd2',
          display_name: 'rapor.pdf',
        }),
      ),
    )
    const { wrapper, router } = await mountPage(ADMIN, '/arsiv?q=rapor&tur=belge')
    const [call] = sent('GET', '/v1/program/archive/attachments')
    expect(call!.query.get('search')).toBe('rapor')
    expect(call!.query.get('mime_category')).toBe('belge')
    expect(call!.query.has('department_id')).toBe(false)
    expect(call!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(call!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(wrapper.find('.archive-grid').exists()).toBe(false)
    expect(wrapper.get('[data-testid="archive-search-results"]').text()).toContain(
      'Arama sonuçları',
    )
    expect(wrapper.get('[data-file-id="f9"]').text()).toBe('rapor.pdf')
    expect(wrapper.get('[data-testid="archive-search-results"] td:nth-child(2)').text()).toBe(
      'Şartname',
    )
    await wrapper.get('[data-file-id="f9"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/arsiv/d2')
    expect(router.currentRoute.value.query).toMatchObject({ dosya: 'f9', gorev: 'w9' })
  })

  it('arama süzgeci boşken dosya okuması yok (ızgara görünür)', async () => {
    server.use(...adminHandlers)
    const { wrapper } = await mountPage(ADMIN)
    expect(sent('GET', '/v1/program/archive/attachments')).toHaveLength(0)
    expect(wrapper.find('[data-testid="archive-search-results"]').exists()).toBe(false)
  })

  it('rapor eylemleri bağlı (W138, KESİN 28): PDF + "Bölüm seç…" + "Önizle" ZIP düğmesinden önce', async () => {
    server.use(...adminHandlers)
    const { wrapper } = await mountPage(ADMIN)
    const actions = wrapper.get('.rp-actions')
    expect(actions.find('[data-testid="season-actions"]').exists()).toBe(true)
    expect(actions.get('[data-testid="season-actions"]').text()).toContain(
      'Dönem sonu raporu (PDF)',
    )
    expect(actions.find('[data-action="pick-sections"]').exists()).toBe(true)
    expect(actions.get('[data-action="preview-season"]').text()).toBe('Önizle')
    const order = [...actions.element.children].map((el) => el.getAttribute('data-testid'))
    expect(order.indexOf('season-actions')).toBeLessThan(order.indexOf('period-zip'))
    expect(wrapper.get('[data-testid="period-zip-button"]').text()).toBe('Dönem arşivi (ZIP)')
  })

  it('"Dönem arşivi (ZIP)" bağlı ve etkin (departman seçimi gerekmez, BE-120); "Dosya yükle" etkin: yönetici bütün programın görevlerini görür', async () => {
    server.use(...adminHandlers)
    const { wrapper } = await mountPage(ADMIN)
    const zip = wrapper.findComponent({ name: 'PeriodZipButton' })
    expect(zip.exists()).toBe(true)
    expect(zip.get('button').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-design-stub="BE-120"]').exists()).toBe(false)
    const upload = wrapper.get('[data-action="upload"]')
    expect(upload.attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-design-stub="BE-072"]').exists()).toBe(false)
    const [call] = sent('GET', '/v1/program/archive/tasks')
    expect(call!.query.get('include_empty')).toBe('true')
    expect(call!.query.has('department_id')).toBe(false)
    await upload.trigger('click')
    const dialog = wrapper.findComponent({ name: 'UploadDialog' })
    expect(dialog.exists()).toBe(true)
    expect(dialog.props('tasks')).toEqual([
      { workItemId: 'w1', title: 'Boş görev', departmentId: 'd1' },
    ])
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
      programFolders(
        ...Array.from({ length: 14 }, (_, i) =>
          folder({ folder_id: `d${i}`, name: `Birim ${i + 10}` }),
        ),
      ),
      programTasks(),
    )
    const { wrapper } = await mountPage(ADMIN)
    expect(wrapper.findAll('.rp-folder')).toHaveLength(12)
    expect(wrapper.get('.archive-more').text()).toBe('2 koordinatörlük daha')
  })

  it('klasör özeti yüklenemezse hata durumu; Yeniden dene yeniden okur', async () => {
    let fail = true
    server.use(
      ...standing({ admin: true }),
      programTasks(),
      http.get(`${ORIGIN}/v1/program/archive/folders`, () =>
        fail
          ? json({ code: 'platform.internal', message: 'x', request_id: 'r', fields: [] }, 500)
          : json(folderBody(folder({ folder_id: 'd1', name: 'Ağ' }))),
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
    server.use(...standing({ rows: [['p1', 'd1', 'koordinator']] }), tasks(), folders())
    const { wrapper, router } = await mountPage(COORD)
    expect(router.currentRoute.value.path).toBe('/arsiv')
    expect(wrapper.text()).toContain('Görüntülenecek klasör yok')
  })

  it('klasör listesi hatası: hata durumu, Yeniden dene sonra yönlendirir', async () => {
    let fail = true
    server.use(
      ...standing({ rows: [['p1', 'd1', 'koordinator']] }),
      tasks(),
      http.get(`${ORIGIN}/v1/records/archive/folders`, () =>
        fail
          ? json({ code: 'platform.internal', message: 'x', request_id: 'r', fields: [] }, 500)
          : json(folderBody(folder({ folder_id: 'd1' }))),
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
      folders(),
      tasks({ id: 'w2', title: 'Zeytin' }, { id: 'w1', title: 'Ağ planı' }),
    )

  it('yönlendirilen rol (K/Ü) 06 sayfasında görev okumaz: archiveTasks isteği yok, yükleme penceresi açılmaz (W127: 07 kendi okumasını açar)', async () => {
    setup()
    const { wrapper, h } = await mountPage(COORD)
    await flushPromises()
    expect(sent('GET', '/v1/records/archive/tasks')).toHaveLength(0)
    const button = wrapper.get('[data-action="upload"]')
    expect(button.attributes('disabled')).toBeDefined()
    await button.trigger('click')
    expect(wrapper.findComponent({ name: 'UploadDialog' }).exists()).toBe(false)
    h.store.commit({ programId: 'p2', lens: 'coordinator', departmentId: 'd9' })
    await flushPromises()
    expect(wrapper.findComponent({ name: 'UploadDialog' }).exists()).toBe(false)
  })

  it('yüklenebilir görev yoksa düğme devre dışı ve nedenini söyler', async () => {
    server.use(...standing({ rows: [['p1', 'd1', 'koordinator']] }), folders(), tasks())
    const { wrapper } = await mountPage(COORD)
    const button = wrapper.get('[data-action="upload"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('title')).toBe('Yüklenebilecek görev bulunamadı.')
  })
})
