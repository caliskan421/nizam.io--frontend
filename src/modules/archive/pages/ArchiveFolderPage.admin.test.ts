import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ADMIN,
  folder,
  resetHarness,
  s3Requests,
  sent,
  server,
  standing,
} from '../model/__tests__/harness'
import {
  archiveBackend,
  archiveFile,
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

const A = standing({ admin: true })
const FOLDERS = [
  folder({ folder_id: 'd1', name: 'Mimari', file_count: 4 }),
  folder({ folder_id: 'd7', name: 'Altyapı', file_count: 9 }),
]
const workItem = (id: string) => ({ work_item_id: id, department_id: 'd7', title: id })
const TASKS = [
  { work_item_id: 'w1', title: 'Gölgelendirme', file_count: 2 },
  { work_item_id: 'w2', title: 'İklimlendirme', file_count: 3 },
  { work_item_id: 'baska', title: 'Başka departman görevi', file_count: 1 },
]
const FILES = manyFiles(4)

const backend = (extra: object = {}) =>
  archiveBackend({
    folders: FOLDERS,
    tasks: TASKS,
    files: FILES,
    workItems: [workItem('w1'), workItem('w2')],
    ...extra,
  })

describe('07 yönetici merceği (P33)', () => {
  it('ağaç archiveFolders ile TÜM klasörler; görevler archiveTasks ∩ klasör görevleri; başlık rotadaki klasör', async () => {
    server.use(...A, ...backend())
    const { wrapper } = await mountPage('/arsiv/d7', ADMIN)
    expect(wrapper.findAll('[data-folder-id]').map((n) => n.attributes('data-folder-id'))).toEqual([
      'd7',
      'd1',
    ])
    // Türkçe ada göre sıra: Altyapı, Mimari.
    expect(wrapper.find('[data-folder-id="d7"]').attributes('aria-current')).toBe('page')
    expect(
      wrapper
        .findAll('[data-testid="folder-tree"] [data-task-id]')
        .map((n) => n.attributes('data-task-id')),
    ).toEqual(['w1', 'w2'])
    expect(wrapper.find('h1').text()).toBe('Altyapı')
    expect(wrapper.find('[data-testid="folder-meta"]').text()).toBe('2 görev klasörü · 9 dosya · —')
    expect(sent('GET', '/v1/records/archive/folders')[0]!.headers.get('X-Nizamio-Department')).toBe(
      'd7',
    )
    expect(sent('GET', '/v1/program/work-items')[0]!.query.get('department_id')).toBe('d7')
  })

  it('görev seçilmeden dosya isteği YOK: "Görev klasörü seçin", arama statik/devre dışı', async () => {
    server.use(...A, ...backend())
    const { wrapper } = await mountPage('/arsiv/d7', ADMIN)
    expect(sent('GET', '/v1/records/archive/attachments')).toHaveLength(0)
    expect(wrapper.find('[data-testid="files-needs-task"]').text()).toContain('Görev klasörü seçin')
    const search = wrapper.find('input[data-testid="folder-search"]')
    expect(search.attributes('disabled')).toBeDefined()
    expect(search.attributes('placeholder')).toBe('Görev klasörü seçin')
  })

  it('görev klasörü seçilince dosyalar o görevle, rotadaki klasör başlığıyla okunur; arama etkinleşir', async () => {
    server.use(...A, ...backend())
    const { wrapper, router, settle } = await mountPage('/arsiv/d7', ADMIN)
    await wrapper.find('button.arch-task[data-task-id="w2"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.query.gorev).toBe('w2')
    const call = sent('GET', '/v1/records/archive/attachments')[0]!
    expect(call.query.get('work_item_id')).toBe('w2')
    expect(call.headers.get('X-Nizamio-Department')).toBe('d7')
    expect(wrapper.findAll('[data-file-id]')).toHaveLength(2)
    expect(
      wrapper.find('input[data-testid="folder-search"]').attributes('disabled'),
    ).toBeUndefined()
    expect(wrapper.find('[data-testid="file-filter-bar"] .rp-count').text()).toBe('3')
  })

  it('kesişimde olmayan görev (başka departman) yok sayılır: dosya isteği çıkmaz', async () => {
    server.use(...A, ...backend())
    const { wrapper } = await mountPage('/arsiv/d7?gorev=baska', ADMIN)
    expect(sent('GET', '/v1/records/archive/attachments')).toHaveLength(0)
    expect(wrapper.find('[data-testid="files-needs-task"]').exists()).toBe(true)
  })

  it('görev listesi 200 tavanında kesildiyse uyarı (ağaç ve kartlar); meta "n+"', async () => {
    server.use(...A, ...backend({ workNext: 'sonraki' }))
    const { wrapper } = await mountPage('/arsiv/d7', ADMIN)
    expect(wrapper.findAll('.arch-tree__note, .arch-tasks__note')).toHaveLength(2)
    expect(wrapper.find('[data-testid="folder-meta"]').text()).toContain('2+ görev klasörü')
  })

  it('geçersiz ya da sanal klasör kimliği ve bilinmeyen klasör: bulunamadı, hiç S3 görev/dosya isteği yok', async () => {
    server.use(...A, ...backend())
    for (const path of ['/arsiv/my-tasks', '/arsiv/d99']) {
      const { wrapper } = await mountPage(path, ADMIN)
      expect(wrapper.find('[data-testid="folder-missing"]').exists()).toBe(true)
      expect(sent('GET', '/v1/records/archive/tasks')).toHaveLength(0)
      expect(sent('GET', '/v1/records/archive/attachments')).toHaveLength(0)
      unmountAll()
    }
    // Sanal kimlik hiç başlığa yazılmadı.
    expect(s3Requests().every((r) => r.headers.get('X-Nizamio-Department') !== 'my-tasks')).toBe(
      true,
    )
  })

  it('başka klasör düğümü: rota /arsiv/d1; görev/dosya seçimi taşınmaz', async () => {
    server.use(...A, ...backend())
    const { wrapper, router, settle } = await mountPage('/arsiv/d7?gorev=w1', ADMIN)
    await wrapper.find('[data-folder-id="d1"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.fullPath).toBe('/arsiv/d1')
  })

  it('Yükle: yönetici ekip satırı aranmadan görür; görevler klasörün görevleri, ön seçili ?gorev', async () => {
    server.use(...A, ...backend({ files: [archiveFile()] }))
    const { wrapper, settle } = await mountPage('/arsiv/d7?gorev=w1', ADMIN)
    await wrapper.find('[data-testid="folder-upload"]').trigger('click')
    await settle()
    const select = document.body.querySelector<HTMLSelectElement>('[data-testid="upload-task"]')!
    expect(select.value).toBe('w1')
    expect([...select.options].map((o) => o.value).filter(Boolean)).toEqual(['w1', 'w2'])
  })
})
