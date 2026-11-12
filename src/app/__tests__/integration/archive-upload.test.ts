// W127 · O3 senaryo 3: yükleme penceresi gerçek sayfadan; görev ön seçimi, anahtarlı yazma + tek
// izinli tekrar, başarıda arşiv/görev türevlerinin yenilenmesi (KESİN 29), sökülmüş sahipte UI yok.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  ADMIN,
  archive,
  boot,
  click,
  COORD,
  fill,
  hold,
  idle,
  resetArchive,
  teardown,
  until,
  useArchiveBackend,
  userClick,
} from './archive-support'

const backend = useArchiveBackend({ coordinator: 'koordinator', member: 'uye' })

/** Tarayıcıda `structuredClone(File)` yine `File`; jsdom'da değil (api/writes.test.ts ile aynı). */
function stubBrowserClone(): void {
  const native = globalThis.structuredClone
  const clone = (value: unknown): unknown => {
    if (value instanceof Blob) return value
    if (Array.isArray(value)) return value.map(clone)
    const plain =
      value !== null &&
      typeof value === 'object' &&
      Object.getPrototypeOf(value) === Object.prototype
    if (plain) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)]))
    return native(value)
  }
  vi.stubGlobal('structuredClone', clone)
}

const realFetch = globalThis.fetch
globalThis.fetch = async (...a: Parameters<typeof fetch>) => {
  try {
    return await realFetch(...a)
  } catch (e) {
    console.log('DBGF', String(e), String((e as Error).cause))
    throw e
  }
}
backend.server.events.on('unhandledException', ({ error }) =>
  console.log('DBGX', String(error), error.stack?.slice(0, 600)),
)
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetArchive()
  await boot({ ...ADMIN, path: '/arsiv/d1?gorev=w1' })
  await until(() => $('[data-file-id="f1"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  resetArchive()
  stubBrowserClone()
})
afterEach(() => {
  teardown()
  vi.unstubAllGlobals()
})
afterAll(() => backend.server.close())

async function choose(name = 'yeni.pdf'): Promise<void> {
  const input = (await until(
    () => $('[data-testid="upload-file"]'),
    'dosya girdisi',
  )) as HTMLInputElement
  const picked = new File(['abc'], name, { type: 'application/pdf' })
  Object.defineProperty(input, 'files', { value: [picked], configurable: true })
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

async function openAndFill(path: string, boot_ = ADMIN): Promise<Awaited<ReturnType<typeof boot>>> {
  const app = await boot({ ...boot_, path })
  await userClick(() => $('[data-testid="folder-upload"]'))
  await until(() => $('[data-testid="upload-task"]'), 'yükleme penceresi')
  await fill('[data-testid="upload-tag"]', 'cikti')
  await choose()
  return app
}

describe('yükleme', () => {
  it('?gorev ön seçili; anahtarlı yazma tek istek; başarıda arşiv + görev sayaçları yenilenir', async () => {
    const app = await boot({ ...ADMIN, path: '/gorevler?gorev=w1' })
    await until(() => backend.sent('GET', '/v1/work-items/w1').length > 0, 'görev ayrıntısı')
    await idle(app.queryClient)
    await app.router.push('/arsiv/d1?gorev=w1')
    await userClick(() => $('[data-testid="folder-upload"]'))
    await until(() => $('[data-testid="upload-task"]'), 'yükleme penceresi')
    await fill('[data-testid="upload-tag"]', 'cikti')
    await choose()
    expect(($('[data-testid="upload-task"]') as HTMLSelectElement).value).toBe('w1')
    await idle(app.queryClient)
    const folders = backend.sent('GET', '/v1/records/archive/folders').length
    const lists = backend.sent('GET', '/v1/records/archive/attachments').length
    const detail = backend.sent('GET', '/v1/work-items/w1').length

    await click(() => $('[data-testid="upload-submit"]'))
    await until(() => !$('[data-testid="upload-task"]'), 'pencere kapandı')
    await idle(app.queryClient)
    const posts = backend.sent('POST', '/v1/work-items/w1/files')
    expect(posts).toHaveLength(1)
    expect(posts[0]!.headers.get('Idempotency-Key')).toBeTruthy()
    expect(posts[0]!.headers.get('X-Requested-With')).toBeTruthy()
    expect(posts[0]!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(posts[0]!.query.get('tag')).toBe('cikti')
    await until(() => $('[data-file-id="fu-1"]'), 'yeni dosya listede')
    expect(backend.sent('GET', '/v1/records/archive/folders').length).toBeGreaterThan(folders)
    expect(backend.sent('GET', '/v1/records/archive/attachments').length).toBeGreaterThan(lists)
    // Görev ayrıntısı arşiv ekranında gözlenmez: geçersizlenir, görev ekranına dönünce yeniden okunur.
    await app.router.push('/gorevler?gorev=w1')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/work-items/w1').length).toBeGreaterThan(detail)
    await app.router.push('/arsiv/d1?gorev=w1')
    // Kapanışta odak tetikleyiciye döner (KESİN 27).
    await until(() => $('[data-testid="folder-upload"]'), 'sayfa')
  })

  it('yanıt kaybolursa tek izinli tekrar AYNI anahtarla gider; dosya bir kez oluşur', async () => {
    archive.state.uploadMode = 'lose-once'
    const app = await openAndFill('/arsiv/d1?gorev=w1')
    await click(() => $('[data-testid="upload-submit"]'))
    await until(() => $('[data-testid="outcome-retry"]'), 'tekrar önerisi')
    await click(() => $('[data-testid="outcome-retry"]'))
    await until(() => !$('[data-testid="upload-task"]'), 'pencere kapandı')
    await idle(app.queryClient)
    const posts = backend.sent('POST', '/v1/work-items/w1/files')
    expect(posts).toHaveLength(2)
    expect(posts[1]!.headers.get('Idempotency-Key')).toBe(posts[0]!.headers.get('Idempotency-Key'))
    expect(archive.state.files.filter((f) => f.display_name === 'yuklenen.pdf')).toHaveLength(1)
  })

  it('koordinatör: 06 yönlendirmesi sonrası kendi klasöründe yükler; başlık kendi departmanı', async () => {
    const app = await boot({ ...COORD, path: '/arsiv' })
    await until(() => app.router.currentRoute.value.path === '/arsiv/d1', 'yönlendirme')
    await userClick(() => $('[data-testid="folder-upload"]'))
    await until(() => $('[data-testid="upload-task"]'), 'pencere')
    await fill('[data-testid="upload-task"]', 'w2')
    await fill('[data-testid="upload-tag"]', 'plan')
    await choose('koord.pdf')
    await click(() => $('[data-testid="upload-submit"]'))
    await until(() => !$('[data-testid="upload-task"]'), 'kapandı')
    expect(
      backend.sent('POST', '/v1/work-items/w2/files')[0]!.headers.get('X-Nizamio-Department'),
    ).toBe('d1')
  })

  it('zorunlu etiket yok: gönderim yazma isteği atmaz', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv/d1?gorev=w1' })
    await userClick(() => $('[data-testid="folder-upload"]'))
    await until(() => $('[data-testid="upload-task"]'), 'pencere')
    await choose()
    await click(() => $('[data-testid="upload-submit"]'))
    await idle(app.queryClient)
    expect(backend.sent('POST', '/v1/work-items/w1/files')).toHaveLength(0)
  })
})

describe('sökülmüş sahip', () => {
  it('uçuştaki yükleme sırasında ekrandan ayrılma: geç sonuç pencere/bildirim üretmez, ek okuma başlamaz', async () => {
    const gate = hold('POST', '/v1/work-items/w1/files')
    const app = await openAndFill('/arsiv/d1?gorev=w1')
    await click(() => $('[data-testid="upload-submit"]'))
    await gate.arrived
    await app.router.push('/')
    await until(() => $('[data-testid="home-page"]'), 'ana sayfa')
    const before = backend.sent('GET', '/v1/records/archive/attachments').length
    gate.release()
    await idle(app.queryClient)
    expect($('[data-testid="upload-task"]')).toBeNull()
    expect($$toast()).toBe('')
    expect(backend.sent('GET', '/v1/records/archive/attachments').length).toBe(before)
  })
})

function $$toast(): string {
  return [...document.querySelectorAll('.rp-toast')].map((e) => e.textContent ?? '').join('')
}
