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

const body = () => document.body

describe('Yükle (UploadDialog bağlama, E-06-35)', () => {
  it('düğme pencereyi açar: görevler klasör departmanıyla (ada göre), ön seçili görev yok; kapanınca odak düğmeye döner', async () => {
    server.use(...K, ...archiveBackend({ files: manyFiles(2) }))
    const { wrapper, settle } = await mountPage('/arsiv/d1', COORD)
    const trigger = wrapper.find('[data-testid="folder-upload"]')
    ;(trigger.element as HTMLElement).focus()
    await trigger.trigger('click')
    await settle()
    const select = body().querySelector<HTMLSelectElement>('[data-testid="upload-task"]')!
    expect(select).not.toBeNull()
    expect([...select.options].filter((o) => o.value).map((o) => o.text)).toEqual([
      'Gölgelendirme çalışmaları',
      'İklimlendirme hesapları',
    ])
    expect(select.value).toBe('')
    body().querySelector<HTMLButtonElement>('[data-testid="upload-cancel"]')!.click()
    await settle()
    expect(body().querySelector('[data-testid="upload-task"]')).toBeNull()
    expect(document.activeElement).toBe(trigger.element)
  })

  it('seçili görev klasörü (?gorev) yükleme penceresinde ön seçili gelir', async () => {
    server.use(...K, ...archiveBackend({ files: manyFiles(2) }))
    const { wrapper, settle } = await mountPage('/arsiv/d1?gorev=w2', COORD)
    await wrapper.find('[data-testid="folder-upload"]').trigger('click')
    await settle()
    expect(body().querySelector<HTMLSelectElement>('[data-testid="upload-task"]')!.value).toBe('w2')
  })

  it('kapsam değişince açık pencere kapanır', async () => {
    server.use(...K, ...archiveBackend({ files: manyFiles(2) }))
    const { wrapper, store, settle } = await mountPage('/arsiv/d1', COORD)
    await wrapper.find('[data-testid="folder-upload"]').trigger('click')
    expect(body().querySelector('[data-testid="upload-task"]')).not.toBeNull()
    store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd2' })
    await settle()
    expect(body().querySelector('[data-testid="upload-task"]')).toBeNull()
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
    expect(wrapper.find('[data-testid="folder-zip"]').exists()).toBe(true)
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
    expect(wrapper.find('[data-testid="folder-zip"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="folder-upload"]').exists()).toBe(false)
  })
})
