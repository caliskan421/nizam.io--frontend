// W127 · O3 senaryo 1: üç rol kapsamı (yönetici / koordinatör / üye) gerçek router + AppShell +
// oturum + durumlu sunucu ile; liste → klasör → görev → dosya → Görev bağlantısı → geri.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  ADMIN,
  boot,
  click,
  COORD,
  idle,
  MEMBER,
  resetArchive,
  s3,
  teardown,
  until,
  useArchiveBackend,
} from './archive-support'

const backend = useArchiveBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetArchive()
  await boot({ ...ADMIN, path: '/arsiv/d1' })
  await until(() => $('[data-testid="archive-folder-page"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => resetArchive())
afterEach(() => teardown())
afterAll(() => backend.server.close())

describe('yönetici', () => {
  it('/arsiv S2 (program başlığı) okur, S3 isteği atmaz; klasör → görev → dosya → Görev bağlantısı → geri', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(() => $('[data-folder-id="d1"]'), 'klasör kartı')
    await idle(app.queryClient)
    expect(s3()).toHaveLength(0)
    const programFolders = backend.sent('GET', '/v1/program/archive/folders')
    expect(programFolders).toHaveLength(1)
    expect(programFolders[0]!.headers.get('X-Nizamio-Department')).toBeNull()
    expect($$('[data-folder-id]').map((e) => e.dataset.folderId)).toEqual(
      expect.arrayContaining(['d1', 'd2']),
    )

    await click(() => $('[data-folder-id="d1"]'))
    await until(() => $('[data-testid="archive-folder-page"]'), 'klasör sayfası')
    expect(app.router.currentRoute.value.path).toBe('/arsiv/d1')
    await until(() => $('[data-task-id="w1"]'), 'görev klasörü')
    // Yönetici görev klasörleri `programArchiveTasks?department_id=d1`: d2 görevi (w3) yok.
    expect($('[data-task-id="w3"]')).toBeNull()
    const tasks = backend.sent('GET', '/v1/program/archive/tasks')
    expect(tasks.some((r) => r.query.get('department_id') === 'd1')).toBe(true)
    // Eski yol yok (P33 geçici yolu): S3 görev/dosya listesi ve work-items kesişimi çağrılmaz.
    expect(backend.sent('GET', '/v1/records/archive/tasks')).toHaveLength(0)
    expect(backend.sent('GET', '/v1/program/work-items')).toHaveLength(0)

    await click(() => $('[data-testid="task-folders"] [data-task-id="w1"]'))
    await until(() => $('[data-file-id="f1"]'), 'dosya')
    await click(() => $('[data-file-id="f1"]'))
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    expect(app.router.currentRoute.value.query.dosya).toBe('f1')
    await click(() => $('[data-testid="preview-task"]'))
    await until(() => app.router.currentRoute.value.path === '/gorevler', 'görev rotası')
    expect(app.router.currentRoute.value.query.gorev).toBe('w1')

    app.router.back()
    await until(() => app.router.currentRoute.value.path === '/arsiv/d1', 'geri')
    await until(() => $('[data-testid="file-preview"]'), 'önizleme geri döndü')
    expect(app.router.currentRoute.value.query.dosya).toBe('f1')
  })

  it('geçersiz klasorId: "Klasör bulunamadı"; görev/dosya okuması yok', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv/yok-boyle-bir' })
    await until(() => $('[data-testid="folder-missing"]'), 'bulunamadı')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/records/archive/attachments')).toHaveLength(0)
    expect(backend.sent('GET', '/v1/records/archive/tasks')).toHaveLength(0)
  })

  it('klasör düzeyi: görev seçilmeden de dosyalar (department_id süzgeciyle) ve arama etkin; "görev seçin" yok', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv/d1' })
    await until(() => $('[data-file-id="f1"]'), 'klasör düzeyi dosyalar')
    expect($('[data-testid="files-needs-task"]')).toBeNull()
    expect(
      ($('[data-testid="folder-search"] input') ??
        $('[data-testid="folder-search"]'))!.hasAttribute('disabled'),
    ).toBe(false)
    await idle(app.queryClient)
    const list = backend.sent('GET', '/v1/program/archive/attachments')
    expect(list).toHaveLength(1)
    expect(list[0]!.query.get('department_id')).toBe('d1')
    expect(list[0]!.query.has('work_item_id')).toBe(false)
    expect(backend.sent('GET', '/v1/records/archive/attachments')).toHaveLength(0)
    // d1'in üç dosyası (d2'nin f4'ü süzgeçle dışarıda).
    expect($$('[data-file-id]').map((e) => e.dataset.fileId)).toEqual(['f1', 'f2', 'f3'])
  })
})

describe('koordinatör ve üye', () => {
  it('koordinatör /arsiv → kendi klasörü (P40), ızgara yok', async () => {
    const app = await boot({ ...COORD, path: '/arsiv' })
    await until(() => app.router.currentRoute.value.path === '/arsiv/d1', 'yönlendirme')
    await until(() => $('[data-file-id="f3"]'), 'dosya')
    expect($('[data-folder-id="d2"]')).toBeNull()
    expect(s3().every((r) => r.headers.get('X-Nizamio-Department') === 'd1')).toBe(true)
  })

  it('üye /arsiv → my-tasks; yalnız atandığı görevin dosyaları', async () => {
    const app = await boot({ ...MEMBER, path: '/arsiv' })
    await until(() => app.router.currentRoute.value.path === '/arsiv/my-tasks', 'yönlendirme')
    await until(() => $('[data-task-id="w1"]'), 'görev')
    expect($('[data-task-id="w2"]')).toBeNull()
  })
})
