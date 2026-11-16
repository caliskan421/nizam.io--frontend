// W127 · O3 senaryo 4 + 8: yeniden adlandırma (409/422), kalıcı silme onayı → liste yenilenir →
// panel kapanır → odak komşu karta; yönetici başkasının dosyasını silemez; kapanış yollarında odak.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  ADMIN,
  archive,
  boot,
  click,
  COORD,
  fill,
  idle,
  resetArchive,
  teardown,
  toasts,
  until,
  useArchiveBackend,
  userClick,
} from './archive-support'

const backend = useArchiveBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetArchive()
  await boot({ ...COORD, path: '/arsiv/d1?gorev=w1&dosya=f2' })
  await until(() => $('[data-testid="file-preview"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => resetArchive())
afterEach(() => teardown())
afterAll(() => backend.server.close())

const open = (path: string) => boot({ ...COORD, path })

async function submitName(name: string): Promise<void> {
  await userClick(() => $('[data-testid="file-rename"]'))
  await until(() => $('[data-testid="rename-input"]'), 'ad penceresi')
  await fill('[data-testid="rename-input"]', name)
  await click(() => $('[data-testid="rename-submit"]'))
}

describe('yeniden adlandırma', () => {
  it('409 records.name_taken: pencere açık kalır, alt hata; yazma anahtarsız', async () => {
    const app = await open('/arsiv/d1?gorev=w1&dosya=f2')
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    await submitName('rapor.pdf')
    await idle(app.queryClient)
    const sent = backend.sent('PATCH', '/v1/files/f2/name')
    expect(sent).toHaveLength(1)
    expect(sent[0]!.headers.get('Idempotency-Key')).toBeNull()
    expect($('[data-testid="rename-input"]')).not.toBeNull()
    expect($('[role="dialog"]')!.textContent).toMatch(/kullan|var|aynı/i)
  })

  it('422 records.name_invalid: pencere açık, liste adı değişmez', async () => {
    const app = await open('/arsiv/d1?gorev=w1&dosya=f2')
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    await submitName('a/b.pdf')
    await idle(app.queryClient)
    expect($('[data-testid="rename-input"]')).not.toBeNull()
    expect($('[data-file-id="f2"]')!.textContent).toContain('foto.png')
  })

  it('başarı: liste yeni adı gösterir, pencere kapanır, odak yeniden adlandır düğmesine döner', async () => {
    const app = await open('/arsiv/d1?gorev=w1&dosya=f2')
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    await submitName('yeni-ad.png')
    await until(() => !$('[data-testid="rename-input"]'), 'pencere kapandı')
    await idle(app.queryClient)
    await until(
      () => $('[data-file-id="f2"]')?.textContent?.includes('yeni-ad.png'),
      'liste yenilendi',
    )
    expect(document.activeElement).toBe($('[data-testid="file-rename"]'))
  })

  it('Esc ve vazgeç: istek yok, odak tetikleyiciye döner', async () => {
    const app = await open('/arsiv/d1?gorev=w1&dosya=f2')
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    for (const close of ['esc', 'cancel'] as const) {
      await userClick(() => $('[data-testid="file-rename"]'))
      await until(() => $('[data-testid="rename-input"]'), 'pencere')
      if (close === 'esc') {
        $('[role="dialog"]')!.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        )
      } else {
        await click(() => $('[data-testid="rename-cancel"]'))
      }
      await until(() => !$('[data-testid="rename-input"]'), `${close} kapandı`)
      await until(
        () => document.activeElement === $('[data-testid="file-rename"]'),
        `${close} odak`,
      )
    }
    await idle(app.queryClient)
    expect(backend.sent('PATCH', '/v1/files/f2/name')).toHaveLength(0)
  })
})

describe('etiketi değiştir (retagFile, BE-074)', () => {
  const pick = (tag: string) => userClick(() => $(`[data-retag="${tag}"]`))

  it('koordinatör: menüden yeni etiket → PATCH → liste/etiket süzgeci yenilenir; etiket süzgecinden çıkan dosyada panel kapanır', async () => {
    const app = await open('/arsiv/d1?gorev=w1&etiket=plan&dosya=f2')
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    await userClick(() => $('[data-testid="file-retag"]'))
    await until(() => $('[data-retag="girdi"]'), 'etiket menüsü')
    await pick('girdi')
    await idle(app.queryClient)
    const patch = backend.sent('PATCH', '/v1/files/f2/tag')
    expect(patch).toHaveLength(1)
    expect(patch[0]!.headers.get('Idempotency-Key')).toBeNull()
    expect(patch[0]!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(archive.state.retags).toEqual([{ file_id: 'f2', tag: 'girdi' }])
    // `plan` süzgecinde artık yok: liste yeniden okundu, kart ve panel düştü.
    await until(() => !$('[data-file-id="f2"]'), 'süzgeçten çıktı')
    await until(() => !$('[data-testid="file-preview"]'), 'panel kapandı')
    // Panel (sahip) sökülünce geç sonuç ekrana özgü bildirim başlatmaz (KESİN 26a).
  })

  it('süzgeçsiz listede dosya kalır; yeni etiket kartta ve panelde görünür; odak tetikleyiciye döner', async () => {
    const app = await open('/arsiv/d1?gorev=w1&dosya=f2')
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    await userClick(() => $('[data-testid="file-retag"]'))
    await pick('cikti')
    await idle(app.queryClient)
    await until(
      () => $('[data-testid="preview-tag"]')?.textContent?.includes('Çıktı'),
      'panelde yeni etiket',
    )
    expect($('[data-file-id="f2"] [data-tag-dot]')?.getAttribute('data-tag-dot')).toBe('cikti')
    await until(() => toasts().includes('Çıktı'), 'bildirim')
    expect(document.activeElement).toBe($('[data-testid="file-retag"]'))
  })

  it('üye başkasının dosyasında etiket düğmesi yok; kendi dosyasında var; ŞY başka birimin dosyasını d2 başlığıyla değiştirir', async () => {
    const { MEMBER } = await import('./archive-support')
    await boot({ ...MEMBER, path: '/arsiv/my-tasks?dosya=f2' })
    await until(() => $('[data-testid="file-preview"]'), 'üye önizleme (başkasının dosyası)')
    expect($('[data-testid="file-retag"]')).toBeNull()
    teardown()

    await boot({ ...MEMBER, path: '/arsiv/my-tasks?dosya=f1' })
    await until(() => $('[data-testid="file-preview"]'), 'üye önizleme (kendi dosyası)')
    expect($('[data-testid="file-retag"]')).not.toBeNull()
    teardown()

    const app = await boot({ ...ADMIN, path: '/arsiv/d2?dosya=f4' })
    await until(() => $('[data-testid="file-preview"]'), 'ŞY önizleme')
    await userClick(() => $('[data-testid="file-retag"]'))
    await pick('ister')
    await idle(app.queryClient)
    expect(backend.sent('PATCH', '/v1/files/f4/tag')[0]!.headers.get('X-Nizamio-Department')).toBe(
      'd2',
    )
  })
})

describe('kalıcı silme', () => {
  it('onay → DELETE → liste yenilenir → panel kapanır → odak komşu karta', async () => {
    const app = await open('/arsiv/d1?gorev=w1&dosya=f2')
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    await userClick(() => $('[data-testid="file-delete"]'))
    await until(() => $('[data-testid="confirm-dialog"]'), 'onay')
    expect(backend.sent('DELETE', '/v1/files/f2')).toHaveLength(0)
    await click(() => $('[data-testid="confirm-accept"]'))
    await until(() => !$('[data-testid="file-preview"]'), 'panel kapandı')
    await idle(app.queryClient)
    expect(backend.sent('DELETE', '/v1/files/f2')).toHaveLength(1)
    await until(() => !$('[data-file-id="f2"]'), 'liste yenilendi')
    await until(() => app.router.currentRoute.value.query.dosya === undefined, 'dosya param düştü')
    await until(() => document.activeElement === $('[data-file-id="f1"]'), 'odak komşu kart')
    await idle(app.queryClient)
    await until(() => toasts().length > 0, 'silindi bildirimi')
  })

  it('onaydan vazgeç: istek yok, odak sil düğmesine döner', async () => {
    const app = await open('/arsiv/d1?gorev=w1&dosya=f2')
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    await userClick(() => $('[data-testid="file-delete"]'))
    await until(() => $('[data-testid="confirm-dialog"]'), 'onay')
    $('[data-testid="confirm-dialog"]')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await until(() => !$('[data-testid="confirm-dialog"]'), 'onay kapandı')
    await until(() => document.activeElement === $('[data-testid="file-delete"]'), 'odak')
    await idle(app.queryClient)
    expect(backend.sent('DELETE', '/v1/files/f2')).toHaveLength(0)
  })

  it('sunucu zaten silmiş (404 file_not_found): silinmiş sayılır, panel kapanır', async () => {
    const app = await open('/arsiv/d1?gorev=w1&dosya=f2')
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    await userClick(() => $('[data-testid="file-delete"]'))
    await until(() => $('[data-testid="confirm-dialog"]'), 'onay')
    // Başka sekme dosyayı silmiş.
    backend.db.seq += 0
    const { archive } = await import('./archive-support')
    archive.state.files = archive.state.files.filter((x) => x.file_id !== 'f2')
    await click(() => $('[data-testid="confirm-accept"]'))
    await until(() => !$('[data-testid="file-preview"]'), 'panel kapandı')
    await idle(app.queryClient)
    expect(backend.sent('DELETE', '/v1/files/f2')).toHaveLength(1)
  })

  it('yönetici başkasının dosyasını silemez: düğme DOM’da yok, DELETE yok; yeniden adlandırabilir', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv/d1?gorev=w1&dosya=f1' })
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    expect($('[data-testid="file-delete"]')).toBeNull()
    expect($('[data-testid="file-rename"]')).not.toBeNull()
    await idle(app.queryClient)
    expect(backend.sent('DELETE', '/v1/files/f1')).toHaveLength(0)
  })
})
