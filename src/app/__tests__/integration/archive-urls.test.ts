// W127 · O3 senaryo 2: arama / etiket / görünüm / sayfalama URL gidiş-dönüşü ve ?dosya derin bağlantı.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { file } from './archive-fake'
import {
  $,
  $$,
  ADMIN,
  archive,
  boot,
  click,
  idle,
  resetArchive,
  teardown,
  until,
  useArchiveBackend,
} from './archive-support'

const backend = useArchiveBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetArchive()
  await boot({ ...ADMIN, path: '/arsiv/d1?gorev=w1' })
  await until(() => $('[data-file-id="f1"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => resetArchive())
afterEach(() => teardown())
afterAll(() => backend.server.close())

const ids = () => $$('[data-file-id]').map((e) => e.dataset.fileId)

describe('URL gidiş-dönüşü', () => {
  it('derin bağlantı: görev + etiket + liste görünümü + arama açılışta uygulanır', async () => {
    await boot({ ...ADMIN, path: '/arsiv/d1?gorev=w1&etiket=plan&gorunum=liste&q=foto' })
    await until(() => $('[data-file-id="f2"]'), 'süzülmüş dosya')
    expect(ids()).toEqual(['f2'])
    expect($('[data-testid="file-list"]')).not.toBeNull()
    const sent = backend.sent('GET', '/v1/records/archive/attachments').at(-1)!
    expect(sent.query.get('work_item_id')).toBe('w1')
    expect(sent.query.get('tag')).toBe('plan')
    expect(sent.query.get('search')).toBe('foto')
  })

  it('etiket ve görünüm tıklaması URL yazar; tekrar basınca etiket kalkar; geri tuşu görev seçimini geri alır', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv/d1' })
    await click(() => $('[data-testid="task-folders"] [data-task-id="w1"]'))
    await until(() => app.router.currentRoute.value.query.gorev === 'w1', 'gorev')
    await until(() => ids().length === 2, 'iki dosya')
    await click(() => $('[data-tag="plan"]'))
    await until(() => app.router.currentRoute.value.query.etiket === 'plan', 'etiket')
    await until(() => ids().join() === 'f2', 'süzüldü')
    await click(() => $('[data-tag="plan"]'))
    await until(() => app.router.currentRoute.value.query.etiket === undefined, 'etiket kalktı')
    await click(() => $('[data-view="liste"]'))
    await until(() => app.router.currentRoute.value.query.gorunum === 'liste', 'liste')
    expect($('[data-testid="file-list"]')).not.toBeNull()
    app.router.back()
    await until(() => app.router.currentRoute.value.query.gorev === undefined, 'geri')
  })

  it('arama: Enter URL q yazar ve sunucuya search gider', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv/d1?gorev=w1' })
    await until(() => ids().length === 2, 'dosyalar')
    const input = await until(
      () => $('[data-testid="folder-search"]') as HTMLInputElement | null,
      'arama',
    )
    const field = input.tagName === 'INPUT' ? input : input.querySelector('input')!
    field.value = 'rapor'
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await until(() => app.router.currentRoute.value.query.q === 'rapor', 'q')
    await until(() => ids().join() === 'f1', 'arama sonucu')
  })

  it('sayfalama: 120 dosyada imleçle yüklenir; ?dosya ilk sayfada yoksa yüklenerek bulunur', async () => {
    for (let i = 0; i < 120; i += 1) {
      const name = `sayfa-${String(i).padStart(3, '0')}.pdf`
      archive.state.files.push(file(`p${i}`, 'w1', 'd1', 'acc-member', { display_name: name }))
    }
    const app = await boot({ ...ADMIN, path: '/arsiv/d1?gorev=w1&dosya=p110' })
    await until(() => $('[data-testid="file-preview"]'), 'önizleme (sayfalar yüklenerek)')
    const pages = backend.sent('GET', '/v1/records/archive/attachments')
    expect(pages.length).toBeGreaterThan(1)
    expect(pages[1]!.query.get('cursor')).toBeTruthy()
    expect(app.router.currentRoute.value.query.dosya).toBe('p110')
  })

  it('?dosya bilinmeyen kimlik: yerleşince param düşer, önizleme açılmaz', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv/d1?gorev=w1&dosya=yok' })
    await idle(app.queryClient)
    await until(() => app.router.currentRoute.value.query.dosya === undefined, 'param düştü')
    expect($('[data-testid="file-preview"]')).toBeNull()
  })
})
