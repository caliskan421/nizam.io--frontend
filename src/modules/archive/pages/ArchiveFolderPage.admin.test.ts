import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ADMIN,
  folder,
  resetHarness,
  s2Requests,
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
  folder({ folder_id: 'd7', name: 'Altyapı', file_count: 9, task_count: 2 }),
]
const task = (id: string, title: string, department: string, count = 1) => ({
  work_item_id: id,
  title,
  department_id: department,
  file_count: count,
})
// S2 yanıtı program geneli döner; klasörün görevleri `department_id` süzgeciyle gelir (sunucuda).
const TASKS = [
  task('w1', 'Gölgelendirme', 'd7', 2),
  task('w2', 'İklimlendirme', 'd7', 3),
  task('baska', 'Başka departman görevi', 'd1', 1),
]
const FILES = manyFiles(4).map((f, i) => archiveFile({ ...f, department_id: i < 3 ? 'd7' : 'd1' }))

const backend = (extra: object = {}) =>
  archiveBackend({ folders: FOLDERS, tasks: TASKS, files: FILES, ...extra })

describe('07 yönetici (S2, BE-072)', () => {
  it('ağaç programArchiveFolders ile TÜM klasörler; görevler department_id süzgeciyle; başlık rotadaki klasör', async () => {
    server.use(...A, ...backend())
    const { wrapper } = await mountPage('/arsiv/d7', ADMIN)
    expect(wrapper.findAll('[data-folder-id]').map((n) => n.attributes('data-folder-id'))).toEqual([
      'd7',
      'd1',
    ])
    expect(wrapper.find('[data-folder-id="d7"]').attributes('aria-current')).toBe('page')
    expect(
      wrapper
        .findAll('[data-testid="folder-tree"] [data-task-id]')
        .map((n) => n.attributes('data-task-id')),
    ).toEqual(['w1', 'w2'])
    expect(wrapper.find('h1').text()).toBe('Altyapı')
    expect(wrapper.find('[data-testid="folder-meta"]').text()).toBe(
      '2 görev klasörü · 9 dosya · 0 B',
    )
    // Klasör özeti süzgeçsiz; görevler/dosyalar `department_id` ile; hiçbirinde departman başlığı yok.
    expect(sent('GET', '/v1/program/archive/folders')[0]!.query.has('department_id')).toBe(false)
    expect(sent('GET', '/v1/program/archive/tasks')[0]!.query.get('department_id')).toBe('d7')
    for (const call of s2Requests()) expect(call.headers.get('X-Nizamio-Department')).toBeNull()
    // Eski yol yok (P33 geçici yolu): S3 okuması ve `listProgramWorkItems` kesişimi çağrılmaz.
    expect(s3Requests()).toHaveLength(0)
    expect(sent('GET', '/v1/program/work-items')).toHaveLength(0)
  })

  it('görev seçilmeden de klasör düzeyi dosyalar okunur; "Görev klasörü seçin" yok, arama etkin', async () => {
    server.use(...A, ...backend())
    const { wrapper } = await mountPage('/arsiv/d7', ADMIN)
    const call = sent('GET', '/v1/program/archive/attachments')[0]!
    expect(call.query.get('department_id')).toBe('d7')
    expect(call.query.has('work_item_id')).toBe(false)
    expect(wrapper.find('[data-testid="files-needs-task"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-file-id]').map((n) => n.attributes('data-file-id'))).toEqual([
      'f1',
      'f2',
      'f3',
    ])
    const search = wrapper.find('input[data-testid="folder-search"]')
    expect(search.attributes('disabled')).toBeUndefined()
    expect(search.attributes('placeholder')).toBe('Dosya, görev veya yükleyen ara…')
    expect(wrapper.find('[data-testid="file-filter-bar"] .rp-count').text()).toBe('3')
  })

  it('görev klasörü seçilince dosyalar o görevle ve department_id ile okunur', async () => {
    server.use(...A, ...backend())
    const { wrapper, router, settle } = await mountPage('/arsiv/d7', ADMIN)
    await wrapper.find('button.arch-task[data-task-id="w2"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.query.gorev).toBe('w2')
    const call = sent('GET', '/v1/program/archive/attachments').at(-1)!
    expect(call.query.get('work_item_id')).toBe('w2')
    expect(call.query.get('department_id')).toBe('d7')
    expect(wrapper.findAll('[data-file-id]')).toHaveLength(1)
    expect(wrapper.find('[data-testid="file-filter-bar"] .rp-count').text()).toBe('1')
  })

  it('klasörün görev listesinde olmayan görev yok sayılır: süzgeç düşer, klasör dosyaları okunur', async () => {
    server.use(...A, ...backend())
    const { wrapper } = await mountPage('/arsiv/d7?gorev=baska', ADMIN)
    const calls = sent('GET', '/v1/program/archive/attachments')
    expect(calls.every((c) => !c.query.has('work_item_id'))).toBe(true)
    expect(wrapper.find('[data-testid="files-needs-task"]').exists()).toBe(false)
  })

  it('sunucu görev listesini kesince (X-Result-Truncated) uyarı (ağaç ve kartlar); meta "n+"', async () => {
    server.use(...A, ...backend({ truncated: true }))
    const { wrapper } = await mountPage('/arsiv/d7', ADMIN)
    expect(wrapper.findAll('.arch-tree__note, .arch-tasks__note')).toHaveLength(2)
    expect(wrapper.find('[data-testid="folder-meta"]').text()).toContain('2+ görev klasörü')
  })

  it('geçersiz ya da sanal klasör kimliği ve bilinmeyen klasör: bulunamadı, hiç görev/dosya isteği yok', async () => {
    server.use(...A, ...backend())
    for (const path of ['/arsiv/my-tasks', '/arsiv/d99']) {
      const { wrapper } = await mountPage(path, ADMIN)
      expect(wrapper.find('[data-testid="folder-missing"]').exists()).toBe(true)
      expect(sent('GET', '/v1/program/archive/tasks')).toHaveLength(0)
      expect(sent('GET', '/v1/program/archive/attachments')).toHaveLength(0)
      unmountAll()
    }
    expect(s3Requests()).toHaveLength(0)
  })

  it('başka klasör düğümü: rota /arsiv/d1; görev/dosya seçimi taşınmaz', async () => {
    server.use(...A, ...backend())
    const { wrapper, router, settle } = await mountPage('/arsiv/d7?gorev=w1', ADMIN)
    await wrapper.find('[data-folder-id="d1"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.fullPath).toBe('/arsiv/d1')
  })

  it('Yükle: yönetici ekip satırı aranmadan görür; seçici include_empty ile dosyasız görevleri de içerir, ön seçili ?gorev', async () => {
    server.use(
      ...A,
      ...backend({
        files: [archiveFile({ department_id: 'd7' })],
        emptyTasks: [task('w9', 'Dosyasız görev', 'd7', 0)],
      }),
    )
    const { wrapper, settle } = await mountPage('/arsiv/d7?gorev=w1', ADMIN)
    await wrapper.find('[data-testid="folder-upload"]').trigger('click')
    await settle()
    const select = document.body.querySelector<HTMLSelectElement>('[data-testid="upload-task"]')!
    expect(select.value).toBe('w1')
    expect([...select.options].map((o) => o.value).filter(Boolean)).toEqual(['w9', 'w1', 'w2'])
    const picker = sent('GET', '/v1/program/archive/tasks').filter(
      (c) => c.query.get('include_empty') === 'true',
    )
    expect(picker).toHaveLength(1)
    expect(picker[0]!.query.get('department_id')).toBe('d7')
  })
})
