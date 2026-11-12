// W127 · O3 senaryo 7: yaşam döngüsü sınıfı. Uçuştaki yazma / bilet sürerken ekran gerçekten
// sökülür (`router.push` ile sayfa, `wrapper.unmount()` ile bütün uygulama), kapsam ve oturum
// değişir; geç sonuç yeni yazma, yeni okuma ya da bildirim başlatmaz (KESİN 26a/b).
// Yerleşme `idle`/`until` ile; sabit bekleme yok.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { siblingSays } from './harness'
import {
  $,
  ADMIN,
  boot,
  click,
  COORD,
  fill,
  hold,
  idle,
  resetArchive,
  switchScope,
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
beforeEach(() => {
  resetArchive()
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const OPEN = '/arsiv/d1?gorev=w1&dosya=f2'
const attachments = () => backend.sent('GET', '/v1/records/archive/attachments').length

async function startRename(): Promise<ReturnType<typeof hold>> {
  const gate = hold('PATCH', '/v1/files/f2/name')
  await userClick(() => $('[data-testid="file-rename"]'))
  await until(() => $('[data-testid="rename-input"]'), 'ad penceresi')
  await fill('[data-testid="rename-input"]', 'gec-sonuc.png')
  await click(() => $('[data-testid="rename-submit"]'))
  await gate.arrived
  return gate
}

async function startDelete(): Promise<ReturnType<typeof hold>> {
  const gate = hold('DELETE', '/v1/files/f2')
  await userClick(() => $('[data-testid="file-delete"]'))
  await click(() => $('[data-testid="confirm-accept"]'))
  await gate.arrived
  return gate
}

describe('ekran sökülür (router.push)', () => {
  it('uçuştaki yeniden adlandırma: geç sonuç bildirim/okuma başlatmaz', async () => {
    const app = await boot({ ...COORD, path: OPEN })
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    const gate = await startRename()
    await app.router.push('/')
    await until(() => $('[data-testid="home-page"]'), 'ana sayfa')
    const before = attachments()
    gate.release()
    await idle(app.queryClient)
    expect(toasts()).toBe('')
    expect(attachments()).toBe(before)
    expect($('[data-testid="rename-input"]')).toBeNull()
  })

  it('uçuştaki kalıcı silme: geç sonuç bildirim/okuma/odak akışı başlatmaz', async () => {
    const app = await boot({ ...COORD, path: OPEN })
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    const gate = await startDelete()
    await app.router.push('/')
    await until(() => $('[data-testid="home-page"]'), 'ana sayfa')
    const before = attachments()
    gate.release()
    await idle(app.queryClient)
    expect(toasts()).toBe('')
    expect(attachments()).toBe(before)
  })

  it('bilet beklerken söküm: bilet tüketilmez, kayıt yok', async () => {
    const app = await boot({ ...COORD, path: OPEN })
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    const gate = hold('POST', '/v1/download-tickets')
    await userClick(() => $('[data-testid="file-download"]'))
    await gate.arrived
    await app.router.push('/')
    await until(() => $('[data-testid="home-page"]'), 'ana sayfa')
    gate.release()
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/downloads/tk-1')).toHaveLength(0)
    expect(toasts()).toBe('')
  })
})

describe('bütün uygulama gerçekten sökülür (unmount)', () => {
  it('uçuştaki yükleme: söküm sonrası geç sonuç hiçbir istek başlatmaz', async () => {
    const app = await boot({ ...COORD, path: OPEN })
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    const gate = await startRename()
    app.wrapper.unmount()
    const count = backend.requests.length
    gate.release()
    await until(() => backend.sent('PATCH', '/v1/files/f2/name').length === 1, 'istek tamamlandı')
    await app.queryClient.cancelQueries()
    expect(backend.requests.length).toBe(count)
    expect(document.body.querySelector('.rp-toast')).toBeNull()
  })
})

describe('kapsam ve oturum değişimi', () => {
  it('program değişince uçuştaki ad değişikliği: pencere düşer, geç sonuç bildirim üretmez', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv/d1?gorev=w1&dosya=f2' })
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    const gate = await startRename()
    await switchScope('Program', 'Teknofest 2027')
    await until(() => app.scope.programId === 'p2', 'kapsam p2')
    gate.release()
    await idle(app.queryClient)
    expect($('[data-testid="rename-input"]')).toBeNull()
    expect(toasts()).toBe('')
    // p2'de d1 klasörü yok: S3 başlığı artık p1 değil; eski program başlığıyla yeni okuma yok.
    const stale = backend.requests
      .slice(backend.requests.findIndex((r) => r.path === '/v1/files/f2/name') + 1)
      .filter((r) => r.path.startsWith('/v1/records/archive'))
      .filter((r) => r.headers.get('X-Nizamio-Program') === 'p1')
    expect(stale).toEqual([])
  })

  it('kardeş sekme çıkışı: uçuştaki silme sonucu giriş ekranında bildirim/okuma üretmez', async () => {
    const app = await boot({ ...COORD, path: OPEN, siblingChannel: true })
    await until(() => $('[data-testid="file-preview"]'), 'önizleme')
    const gate = await startDelete()
    const { SESSION_MESSAGE_VERSION } = await import('@/shared/session/messages')
    siblingSays({
      v: SESSION_MESSAGE_VERSION,
      type: 'logout',
      accountId: app.session.accountId,
    })
    await until(() => $('[data-testid="login-form"]'), 'giriş ekranı')
    const count = backend.requests.length
    gate.release()
    await until(() => backend.sent('DELETE', '/v1/files/f2').length === 1, 'istek tamamlandı')
    expect(backend.requests.length).toBe(count)
    expect(toasts()).toBe('')
    expect(document.body.textContent).not.toContain('sartname.pdf')
  })
})
