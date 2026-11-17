// W194 · O3: arşiv araması `search_scope=all` (dosya adı + görev başlığı + yükleyen adı; RECORDS-K47)
// ve görevsiz yükleme yokluğu. URL durumu mevcut `q`; yeni dropdown/rota parametresi yok. Eşik
// (iki karakter) sunucuda uygulanır: istemci sonucu süzmez, tek karakterde yalnız yardımcı metin.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  ADMIN,
  boot,
  click,
  idle,
  resetArchive,
  teardown,
  until,
  useArchiveBackend,
  userClick,
} from './archive-support'

const backend = useArchiveBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetArchive()
  await boot({ ...ADMIN, path: '/arsiv?q=ras' })
  await until(() => $('[data-testid="archive-search-results"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => resetArchive())
afterEach(() => teardown())
afterAll(() => backend.server.close())

const ids = () =>
  $$('[data-testid="archive-search-results"] [data-file-id]').map((e) => e.dataset.fileId)
const lastSearch = () => backend.sent('GET', '/v1/program/archive/attachments').at(-1)!

describe('06 yönetici araması', () => {
  it('görev başlığı (Türkçe büyük harf) ve yükleyen adı, dosya adı olmadan bulunur; istek search_scope=all', async () => {
    const app = await boot({ ...ADMIN, path: `/arsiv?q=${encodeURIComponent('ŞASİ')}` })
    await until(() => ids().length === 1, 'görev başlığı eşleşmesi')
    // f3 'sartname.pdf': dosya adında şasi yok; eşleşme yalnız görev başlığından (Şasi çizimi).
    expect(ids()).toEqual(['f3'])
    await idle(app.queryClient)
    const q = lastSearch().query
    expect(q.get('search')).toBe('ŞASİ')
    expect(q.get('search_scope')).toBe('all')
    expect(backend.sent('GET', '/v1/records/archive/attachments')).toHaveLength(0)
  })

  it('yükleyen adıyla arama: Ayşe → üyenin yüklediği dosyalar; toplam sunucudan', async () => {
    await boot({ ...ADMIN, path: `/arsiv?q=${encodeURIComponent('ayşe')}` })
    await until(() => ids().length === 2, 'yükleyen eşleşmesi')
    expect(ids().sort()).toEqual(['f1', 'f4'])
    expect($('[data-testid="archive-search-results"] h2')!.textContent).toContain('2')
  })

  it('tek karakter: istek yine search_scope=all, görev/yükleyen eşleşmesi yok, 2 karakter yardımı görünür', async () => {
    const app = await boot({ ...ADMIN, path: `/arsiv?q=${encodeURIComponent('ş')}` })
    await until(() => $('[data-testid="archive-search-hint"]'), 'yardımcı metin')
    await idle(app.queryClient)
    expect(lastSearch().query.get('search_scope')).toBe('all')
    expect(ids()).toEqual([])
    expect($('[data-testid="archive-search-hint"]')!.textContent).toContain('en az 2 karakter')
  })

  it('arama yokken search_scope gönderilmez; yer tutucu eski dosya adı vaadini taşımaz', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(() => $('[data-folder-id="d1"]'), 'klasörler')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/program/archive/attachments')).toHaveLength(0)
    const input = $('input[type="search"]') as HTMLInputElement
    expect(input.placeholder).toBe('Dosya, görev veya yükleyen ara…')
    expect(input.placeholder).not.toContain('Dosya adı ara')
  })
})

describe('07 klasör araması', () => {
  it('klasör içinde görev başlığıyla arama: department_id süzgeci + search_scope=all; tek karakterde yardımcı metin', async () => {
    const app = await boot({ ...ADMIN, path: `/arsiv/d1?q=${encodeURIComponent('şasi')}` })
    await until(() => $('[data-file-id="f3"]'), 'görev başlığı eşleşmesi')
    await idle(app.queryClient)
    const q = lastSearch().query
    expect(q.get('department_id')).toBe('d1')
    expect(q.get('search_scope')).toBe('all')
    expect($('[data-testid="folder-search-hint"]')).toBeNull()
    await app.router.push(`/arsiv/d1?q=${encodeURIComponent('ş')}`)
    await until(() => $('[data-testid="folder-search-hint"]'), 'tek karakter yardımı')
  })
})

describe('görevsiz yükleme yok', () => {
  it('görev seçilmeden gönderim hiçbir yükleme isteği atmaz; "görevsiz" seçeneği bulunmaz', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(
      () =>
        $('[data-action="upload"]') && !($('[data-action="upload"]') as HTMLButtonElement).disabled,
      'etkin düğme',
    )
    await userClick(() => $('[data-action="upload"]'))
    await until(() => $('[data-testid="upload-task"]'), 'yükleme penceresi')
    await click(() => $('[data-testid="upload-submit"]'))
    await idle(app.queryClient)
    expect(
      backend.requests.filter((r) => r.method === 'POST' && r.path.endsWith('/files')),
    ).toEqual([])
    const select = $('[data-testid="upload-task"]') as HTMLSelectElement
    expect(select.value).toBe('')
    expect([...select.options].some((o) => /görevsiz|göreve bağsız/i.test(o.text))).toBe(false)
  })
})
