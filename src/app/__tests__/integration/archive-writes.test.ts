// W127 · O3 senaryo 4 + 8: yeniden adlandırma (409/422), kalıcı silme onayı → liste yenilenir →
// panel kapanır → odak komşu karta; yönetici başkasının dosyasını silemez; kapanış yollarında odak.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  ADMIN,
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
