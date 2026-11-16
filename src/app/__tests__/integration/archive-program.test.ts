// W171 · F8 canlıya alma (M-A01, BE-072): yönetici program arşivi (S2) gerçek uç biçimiyle.
// Durumlu sahte arşiv sunucusu (S2 yalnız şirket yöneticisine; dosya işlemi başlığı dosyanın
// departmanıyla eşleşmezse 404). Yetki matrisi ŞY/K/Ü × kendi/başka birim; P33 geçici yolunun
// ("eski yol") çağrılmadığı; başlık = satırın `department_id`'si.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  ADMIN,
  archive,
  boot,
  click,
  COORD,
  fill,
  idle,
  MEMBER,
  resetArchive,
  s3,
  teardown,
  until,
  useArchiveBackend,
  userClick,
} from './archive-support'

const backend = useArchiveBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetArchive()
  await boot({ ...ADMIN, path: '/arsiv/d2?dosya=f4' })
  await until(() => $('[data-testid="file-preview"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => resetArchive())
afterEach(() => teardown())
afterAll(() => backend.server.close())

const s2 = () => backend.requests.filter((r) => r.path.startsWith('/v1/program/archive'))

describe("yönetici (ŞY): S2 okuma, S3 dosya işlemi başlığı = satırın department_id'si", () => {
  it('başka birimin dosyası: 06 aramasıyla bulunur, sonuç klasörünü açar; yeniden adlandırma başlığı d2', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv?q=yazilim' })
    await until(() => $('[data-testid="archive-search-results"] [data-file-id="f4"]'), 'sonuç')
    const search = backend.sent('GET', '/v1/program/archive/attachments')[0]!
    expect(search.query.get('search')).toBe('yazilim')
    expect(search.query.has('department_id')).toBe(false)
    expect(search.headers.get('X-Nizamio-Department')).toBeNull()
    await userClick(() => $('[data-testid="archive-search-results"] [data-file-id="f4"]'))
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    expect(app.router.currentRoute.value.path).toBe('/arsiv/d2')
    await userClick(() => $('[data-testid="file-rename"]'))
    await until(() => $('[data-testid="rename-input"]'), 'ad penceresi')
    await fill('[data-testid="rename-input"]', 'yeni-yazilim.pdf')
    await click(() => $('[data-testid="rename-submit"]'))
    await until(() => !$('[data-testid="rename-input"]'), 'pencere kapandı')
    const patch = backend.sent('PATCH', '/v1/files/f4/name')
    expect(patch).toHaveLength(1)
    expect(patch[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    // Rotadaki klasör değil, satırın department_id'si (bu örnekte ikisi de d2; d1 olsaydı 404 olurdu).
    expect(patch[0]!.headers.get('X-Nizamio-Department')).toBe('d2')
    await idle(app.queryClient)
    expect(archive.state.files.find((f) => f.file_id === 'f4')!.display_name).toBe(
      'yeni-yazilim.pdf',
    )
  })

  it('eski yol yok (P33): klasörde S3 arşiv okuması ve work-items kesişimi çağrılmaz', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv/d1' })
    await until(() => $('[data-file-id="f1"]'), 'klasör düzeyi dosyalar')
    await until(() => $('[data-task-id="w1"]'), 'görev klasörü')
    await idle(app.queryClient)
    expect(
      s3()
        .filter((r) => r.path.startsWith('/v1/records/archive'))
        .map((r) => r.path),
    ).toEqual([])
    expect(backend.sent('GET', '/v1/program/work-items')).toHaveLength(0)
    expect(s2().every((r) => r.headers.get('X-Nizamio-Department') === null)).toBe(true)
    expect(s2().map((r) => r.path)).toEqual(
      expect.arrayContaining([
        '/v1/program/archive/folders',
        '/v1/program/archive/tasks',
        '/v1/program/archive/attachments',
      ]),
    )
  })
})

describe('klasör özeti: görev sayısı, boyut, son yükleme (BE-025)', () => {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

  it('06 kartları ve depolama toplamı sunucu alanlarından; "Son yükleme" sıralaması; 07 başlık bayt toplamı', async () => {
    for (const f of archive.state.files) {
      f.created_at = f.department_id === 'd1' ? daysAgo(5) : daysAgo(0)
    }
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(() => $('[data-folder-id="d1"]'), 'klasör kartları')
    const meta = (id: string, field: string) =>
      $(`[data-folder-id="${id}"] [data-field="${field}"]`)?.textContent
    expect(meta('d1', 'meta')).toBe('3 dosya · 2 görev')
    expect(meta('d1', 'size')).toBe('6,0 KB')
    expect(meta('d1', 'last')).toBe('5 gün')
    expect(meta('d2', 'meta')).toBe('1 dosya · 1 görev')
    expect(meta('d2', 'last')).toBe('bugün')
    // Depolama toplamı `totals`: 4 dosya, 8 KB.
    expect($('[data-field="files"]')?.textContent).toBe('4')
    expect($('[data-field="bytes"]')?.textContent).toBe('8,0 KB')
    expect($$('[data-folder-id]').map((e) => e.dataset.folderId)).toEqual(['d1', 'd2'])
    await userClick(() => $('.archive-sort__btn'))
    await userClick(() => $('[data-sort="sonYukleme"]'))
    await until(() => app.router.currentRoute.value.query.sirala === 'son:azalan', 'sirala')
    expect($$('[data-folder-id]').map((e) => e.dataset.folderId)).toEqual(['d2', 'd1'])
    // Eski yol yok: boyut/son yükleme için ek okuma (fan-out) yok; tek `programArchiveFolders`.
    expect(backend.sent('GET', '/v1/program/archive/folders')).toHaveLength(1)

    await click(() => $('[data-folder-id="d1"]'))
    await until(
      () => $('[data-testid="folder-meta"]')?.textContent === '2 görev klasörü · 3 dosya · 6,0 KB',
      'klasör başlığı meta satırı',
    )
  })
})

describe('01 yönetici kartı arşiv özeti (E-01-37)', () => {
  it('kart başına dosya sayısı programArchiveFolders tek isteğinden; fan-out ve S3 yok', async () => {
    const app = await boot({ ...ADMIN, path: '/' })
    await until(() => $('[data-department="d1"] [data-testid="archive"]'), 'koordinatörlük kartı')
    await until(
      () => $('[data-department="d1"] [data-testid="archive"]')?.textContent === '3',
      'arşiv sayısı',
    )
    expect($('[data-department="d2"] [data-testid="archive"]')?.textContent).toBe('1')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/program/archive/folders')).toHaveLength(1)
    expect(s3().filter((r) => r.path.startsWith('/v1/records/archive'))).toHaveLength(0)
  })
})

describe('koordinatör / üye: S2 yok; başka birim klasörü bulunamadı', () => {
  it.each([
    ['koordinatör', COORD],
    ['üye', MEMBER],
  ] as const)('%s: kendi klasöründe S3, hiçbir S2 isteği yok', async (_who, who) => {
    const app = await boot({ ...who, path: '/arsiv' })
    await until(() => $('[data-file-id]'), 'kendi klasörü')
    await idle(app.queryClient)
    expect(s2()).toHaveLength(0)
    expect(s3().length).toBeGreaterThan(0)
  })

  it('koordinatör başka birimin (d2) klasörüne gider: "Klasör bulunamadı"; yalnız kendi departman başlığı, S2 yok', async () => {
    const app = await boot({ ...COORD, path: '/arsiv/d2' })
    await until(() => $('[data-testid="folder-missing"]'), 'bulunamadı')
    await idle(app.queryClient)
    expect(s2()).toHaveLength(0)
    expect(s3().every((r) => r.headers.get('X-Nizamio-Department') === 'd1')).toBe(true)
    expect($('[data-file-id="f4"]')).toBeNull()
  })

  it('üye başka birimin dosyasına ulaşamaz: kendi sanal klasörü yalnız atandığı görevler', async () => {
    const app = await boot({ ...MEMBER, path: '/arsiv/my-tasks' })
    await until(() => $('[data-file-id="f1"]'), 'dosya')
    await idle(app.queryClient)
    expect($$('[data-file-id]').map((e) => e.dataset.fileId)).not.toContain('f4')
  })
})
