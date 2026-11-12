import type { VueWrapper } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  COORD,
  http,
  json,
  ORIGIN,
  resetHarness,
  s3Requests,
  sent,
  server,
  standing,
} from '../model/__tests__/harness'
import {
  archiveBackend,
  archiveFile,
  crumb,
  manyFiles,
  mountPage,
  unmountAll,
} from './folder/__tests__/mount'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

const K = standing({ rows: [['p1', 'd1', 'koordinator']] })
const FILES = [
  archiveFile({
    file_id: 'f1',
    display_name: 'saha.jpeg',
    content_type: 'image/jpeg',
    tag: 'girdi',
  }),
  archiveFile({ file_id: 'f2', display_name: 'rapor.pdf', work_item_id: 'w2', tag: 'plan' }),
  archiveFile({ file_id: 'f3', display_name: 'tablo.xlsx', work_item_id: 'w2', tag: 'plan' }),
]

const cards = (w: VueWrapper) =>
  w.findAll('[data-file-id]').map((e) => e.attributes('data-file-id'))

describe('07 koordinatör: başlık, ağaç, görev klasörleri, dosyalar', () => {
  it('klasör adı kırıntıda; meta canlı sayılar + statik bayt; ağaç tek düğüm; "grup" rozeti ve kişi adı yok', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    const { wrapper } = await mountPage('/arsiv/d1', COORD)
    expect(crumb()).toBe('Koordinatörlük 1')
    expect(wrapper.find('h1').text()).toBe('Koordinatörlük 1')
    expect(wrapper.find('[data-testid="folder-meta"]').text()).toBe('2 görev klasörü · 3 dosya · —')
    expect(wrapper.findAll('[data-folder-id]')).toHaveLength(1)
    expect(wrapper.find('[data-folder-id="d1"]').attributes('aria-current')).toBe('page')
    expect(wrapper.text()).not.toMatch(/çalışma grubu|\bgrup\b/i)
    expect(cards(wrapper)).toEqual(['f1', 'f2', 'f3'])
    // Tüm S3 istekleri koordinatörün departman başlığıyla; süzgeçsiz dosya okuması.
    for (const r of s3Requests()) expect(r.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(sent('GET', '/v1/records/archive/attachments')[0]!.query.get('work_item_id')).toBeNull()
    // Süzgeçsiz sayaç klasörün kesin dosya sayısı.
    expect(wrapper.find('[data-testid="file-filter-bar"] .rp-count').text()).toBe('3')
  })

  it('görev klasörü kartı ?gorev yazar, dosyaları görevle süzer; sayaç görev sayısı; geri tuşu kaldırır', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    const { wrapper, router, settle } = await mountPage('/arsiv/d1', COORD)
    await wrapper.find('button.arch-task[data-task-id="w2"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.query.gorev).toBe('w2')
    expect(cards(wrapper)).toEqual(['f2', 'f3'])
    const last = sent('GET', '/v1/records/archive/attachments').at(-1)!
    expect(last.query.get('work_item_id')).toBe('w2')
    expect(wrapper.find('[data-testid="file-filter-bar"] .rp-count').text()).toBe('3')
    expect(
      wrapper.find('[data-testid="folder-tree"] [data-task-id="w2"]').attributes('aria-current'),
    ).toBe('page')
    router.back()
    await settle()
    expect(router.currentRoute.value.query.gorev).toBeUndefined()
    expect(cards(wrapper)).toEqual(['f1', 'f2', 'f3'])
  })

  it('etiket segmenti ?etiket yazar ve sunucu süzgecini gönderir; süzgeçlide sayaç "n+" olmaz tek sayfada', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    const { wrapper, router, settle } = await mountPage('/arsiv/d1', COORD)
    await wrapper.find('[data-tag="plan"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.query.etiket).toBe('plan')
    expect(sent('GET', '/v1/records/archive/attachments').at(-1)!.query.get('tag')).toBe('plan')
    expect(cards(wrapper)).toEqual(['f2', 'f3'])
    expect(wrapper.find('[data-testid="file-filter-bar"] .rp-count').text()).toBe('2')
  })

  it('imleçli liste: süzgeçlide "n+", "Daha fazla yükle" aynı süzgeçle sonraki sayfayı ekler', async () => {
    server.use(...K, ...archiveBackend({ files: manyFiles(5), pageSize: 2 }))
    const { wrapper, settle } = await mountPage('/arsiv/d1?etiket=sonuc', COORD)
    expect(cards(wrapper)).toHaveLength(2)
    expect(wrapper.find('[data-testid="file-filter-bar"] .rp-count').text()).toBe('2+')
    await wrapper.find('.arch-files__more').trigger('click')
    await settle()
    expect(cards(wrapper)).toHaveLength(4)
    const calls = sent('GET', '/v1/records/archive/attachments')
    expect(calls.at(-1)!.query.get('cursor')).toBe('2')
    expect(calls.at(-1)!.query.get('tag')).toBe('sonuc')
  })

  it('görünüm segmenti ?gorunum=liste yazar; tablo sütunları; ızgaraya dönünce param düşer', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    const { wrapper, router, settle } = await mountPage('/arsiv/d1', COORD)
    await wrapper.find('[data-view="liste"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.query.gorunum).toBe('liste')
    expect(wrapper.find('table.arch-list').exists()).toBe(true)
    await wrapper.find('[data-view="izgara"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.query.gorunum).toBeUndefined()
    expect(wrapper.find('table.arch-list').exists()).toBe(false)
  })

  it('arama (enter): ?q yazar, search süzgeci sunucuya gider, dosya adı araması; kutu K için etkin', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    const { wrapper, router, settle } = await mountPage('/arsiv/d1', COORD)
    const input = wrapper.find(
      '[data-testid="folder-search"] input, input[data-testid="folder-search"]',
    )
    expect(input.attributes('disabled')).toBeUndefined()
    await input.setValue('rapor')
    await input.trigger('keydown', { key: 'Enter' })
    await settle()
    expect(router.currentRoute.value.query.q).toBe('rapor')
    expect(sent('GET', '/v1/records/archive/attachments').at(-1)!.query.get('search')).toBe('rapor')
  })

  it('geçersiz URL değerleri düşer: bilinmeyen etiket, biçimsiz görev', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    await mountPage('/arsiv/d1?etiket=saha&gorev=../x', COORD)
    const call = sent('GET', '/v1/records/archive/attachments')[0]!
    expect(call.query.get('tag')).toBeNull()
    expect(call.query.get('work_item_id')).toBeNull()
  })

  it('listede olmayan görev kimliği yok sayılır (bayat bağlantı): süzgeçsiz okunur', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    const { wrapper } = await mountPage('/arsiv/d1?gorev=yok-boyle-bir-gorev', COORD)
    expect(
      sent('GET', '/v1/records/archive/attachments').every(
        (r) => r.query.get('work_item_id') === null,
      ),
    ).toBe(true)
    expect(cards(wrapper)).toHaveLength(3)
  })

  it('boş klasör: boş durum; hata: yeniden dene aynı uca yeniden gider', async () => {
    server.use(...K, ...archiveBackend({ files: [], tasks: [] }))
    const empty = await mountPage('/arsiv/d1', COORD)
    expect(empty.wrapper.find('[data-testid="files-empty"]').exists()).toBe(true)
    expect(empty.wrapper.find('[data-testid="tasks-empty"]').exists()).toBe(true)
    unmountAll()
    resetHarness()
    server.use(...K, ...archiveBackend({ files: FILES, filesStatus: 500 }))
    const failed = await mountPage('/arsiv/d1', COORD)
    expect(failed.wrapper.find('[data-testid="files-error"]').exists()).toBe(true)
    const before = sent('GET', '/v1/records/archive/attachments').length
    await failed.wrapper.find('[data-testid="files-error"] button').trigger('click')
    await failed.settle()
    expect(sent('GET', '/v1/records/archive/attachments').length).toBeGreaterThan(before)
  })

  it('klasör ZIP ve Yükle yetkili koordinatöre çizilir; üyede Yükle de var, K1 görünürlüğü', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    const { wrapper } = await mountPage('/arsiv/d1', COORD)
    expect(wrapper.find('[data-testid="folder-zip"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="folder-upload"]').exists()).toBe(true)
  })

  it('klasör bulunamadı / erişim yok: tek durum (ağaç, görev ve dosya alanı çizilmez); "Arşive dön" /arsiv', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    const { wrapper, router, settle } = await mountPage('/arsiv/baska-klasor', COORD)
    expect(wrapper.find('[data-testid="folder-missing"]').text()).toContain('Klasör bulunamadı')
    expect(wrapper.find('[data-testid="folder-tree"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="file-grid"]').exists()).toBe(false)
    await wrapper.find('[data-testid="folder-missing"] button').trigger('click')
    await settle()
    expect(router.currentRoute.value.name).toBe('archive.folders')
  })

  it('kapsam (departman) değişince koordinatör /arsiv girişine döner; seçimler sıfırlanır', async () => {
    server.use(
      ...K,
      ...archiveBackend({ files: FILES }),
      http.get(`${ORIGIN}/v1/me/departments`, () => json({ departments: [] })),
    )
    const { router, store, settle } = await mountPage('/arsiv/d1?gorev=w1&dosya=f1', COORD)
    store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd2' })
    await settle()
    expect(router.currentRoute.value.name).toBe('archive.folders')
  })
})
