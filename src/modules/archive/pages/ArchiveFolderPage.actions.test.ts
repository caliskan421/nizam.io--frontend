import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  COORD,
  MEMBER,
  folder,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  standing,
} from '../model/__tests__/harness'
import { archiveBackend, manyFiles, mountPage, unmountAll } from './folder/__tests__/mount'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

const K = standing({ rows: [['p1', 'd1', 'koordinator']] })
const U = standing({ rows: [['p1', 'd1', 'uye']] })

describe('Yükle (W125 UploadDialog bağlama, E-06-35)', () => {
  it('düğme pencereyi açar: görevler klasör departmanıyla, ön seçili görev yok; kapanınca odak düğmeye döner', async () => {
    server.use(...K, ...archiveBackend({ files: manyFiles(2) }))
    const { wrapper, settle } = await mountPage('/arsiv/d1', COORD)
    const trigger = wrapper.find('[data-testid="folder-upload"]')
    ;(trigger.element as HTMLElement).focus()
    await trigger.trigger('click')
    await settle()
    const dialog = wrapper.find('[data-testid="upload-dialog"]')
    expect(dialog.attributes('data-default')).toBe('null')
    const tasks = JSON.parse(wrapper.find('[data-testid="upload-tasks"]').text()) as {
      workItemId: string
      title: string
      departmentId: string
    }[]
    // Ada göre sıralı (Türkçe), hepsi isteğin departman başlığı.
    expect(tasks.map((t) => [t.title, t.departmentId])).toEqual([
      ['Gölgelendirme çalışmaları', 'd1'],
      ['İklimlendirme hesapları', 'd1'],
    ])
    ;(
      wrapper.find('[data-testid="upload-dialog"] [data-act="close"]').element as HTMLElement
    ).focus()
    await wrapper.find('[data-testid="upload-dialog"] [data-act="close"]').trigger('click')
    await settle()
    expect(wrapper.find('[data-testid="upload-dialog"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
  })

  it('seçili görev klasörü (?gorev) yükleme penceresine defaultTaskId olarak gider', async () => {
    server.use(...K, ...archiveBackend({ files: manyFiles(2) }))
    const { wrapper, settle } = await mountPage('/arsiv/d1?gorev=w2', COORD)
    await wrapper.find('[data-testid="folder-upload"]').trigger('click')
    await settle()
    expect(wrapper.find('[data-testid="upload-dialog"]').attributes('data-default')).toBe('w2')
  })

  it('kapsam değişince açık pencere kapanır', async () => {
    server.use(...K, ...archiveBackend({ files: manyFiles(2) }))
    const { wrapper, store, settle } = await mountPage('/arsiv/d1', COORD)
    await wrapper.find('[data-testid="folder-upload"]').trigger('click')
    expect(wrapper.find('[data-testid="upload-dialog"]').exists()).toBe(true)
    store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd2' })
    await settle()
    expect(wrapper.find('[data-testid="upload-dialog"]').exists()).toBe(false)
  })
})

describe('üye: sanal "Görevlerim" klasörü', () => {
  const virtual = folder({
    folder_id: 'my-tasks',
    name: 'Görevlerim',
    file_count: 2,
    is_virtual: true,
  })

  it('tek düğüm; klasör ZIP (sanal klasör, K1) ve Yükle (atanmış üye) görünür; başlık seçili kapsamdan', async () => {
    server.use(...U, ...archiveBackend({ folders: [virtual], files: manyFiles(2) }))
    const { wrapper } = await mountPage('/arsiv/my-tasks', MEMBER)
    expect(wrapper.find('h1').text()).toBe('Görevlerim')
    expect(wrapper.findAll('[data-folder-id]')).toHaveLength(1)
    expect(wrapper.find('[data-testid="zip"]').attributes('data-folder')).toBe('my-tasks')
    expect(wrapper.find('[data-testid="folder-upload"]').exists()).toBe(true)
    expect(
      sent('GET', '/v1/records/archive/attachments')[0]!.headers.get('X-Nizamio-Department'),
    ).toBe('d1')
  })

  it('yetkisiz eylem gizlenir: ekip satırı olmayan (yalnız izleyen) kullanıcıda ZIP ve Yükle yok', async () => {
    server.use(
      ...standing({ rows: [['p1', 'd9', 'uye']] }),
      http.get(`${ORIGIN}/v1/records/archive/folders`, () => json({ folders: [folder()] })),
      ...archiveBackend({ files: manyFiles(1) }).slice(1),
    )
    const { wrapper } = await mountPage('/arsiv/d1', COORD)
    expect(wrapper.find('[data-testid="zip"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="folder-upload"]').exists()).toBe(false)
  })
})
