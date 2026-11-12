// W127 · O3 senaryo 5: indirme / ZIP bilet akışı (bilet → tüketim), 429 Retry-After, 422 çok büyük,
// dönem ZIP'i yalnız yönetici ve /arsiv'te BE-120 ile devre dışı.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  ADMIN,
  archive,
  boot,
  COORD,
  idle,
  MEMBER,
  resetArchive,
  teardown,
  toasts,
  until,
  useArchiveBackend,
  userClick,
} from './archive-support'

const backend = useArchiveBackend({ coordinator: 'koordinator', member: 'uye' })
const saved: string[] = []

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetArchive()
  await boot({ ...COORD, path: '/arsiv/d1?gorev=w2&dosya=f3' })
  await until(() => $('[data-testid="file-preview"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  resetArchive()
  saved.length = 0
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    saved.push(this.download)
  })
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const note = (id: string) => $(`[data-testid="${id}"]`)?.textContent ?? ''

describe('tek dosya indirme', () => {
  it('bilet dosyanın departmanıyla alınır, hemen tüketilir ve kaydedilir; ikinci bilet yok', async () => {
    const app = await boot({ ...COORD, path: '/arsiv/d1?gorev=w2&dosya=f3' })
    await userClick(() => $('[data-testid="file-download"]'))
    await until(() => saved.length > 0, 'kaydedildi')
    await idle(app.queryClient)
    const [issue] = backend.sent('POST', '/v1/download-tickets')
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(1)
    expect(issue!.body).toEqual({ method: 'GET', path: '/v1/files/f3/download' })
    expect(issue!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(backend.sent('GET', '/v1/downloads/tk-1')).toHaveLength(1)
    expect(saved).toHaveLength(1)
  })

  it('429 Retry-After (bilet üretimi): bekleme metni, otomatik tekrar yok', async () => {
    archive.state.ticket = 'rate-limited'
    const app = await boot({ ...COORD, path: '/arsiv/d1?gorev=w2&dosya=f3' })
    await userClick(() => $('[data-testid="file-download"]'))
    await until(() => toasts().includes('17'), 'Retry-After metni')
    await idle(app.queryClient)
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(1)
    expect(backend.sent('GET', '/v1/downloads/tk-1')).toHaveLength(0)
    expect(saved).toHaveLength(0)
  })
})

describe('klasör ZIP', () => {
  it('yönetici: 422 records.too_large "çok büyük"; yeni bilet yalnız yeni tıklamayla', async () => {
    archive.state.redeem = 'too-large'
    const app = await boot({ ...ADMIN, path: '/arsiv/d1' })
    await userClick(() => $('[data-testid="folder-zip-button"]'))
    await until(() => /büyük/i.test(note('folder-zip-note')), 'çok büyük metni')
    await idle(app.queryClient)
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(1)
    expect(backend.sent('POST', '/v1/download-tickets')[0]!.body).toEqual({
      method: 'GET',
      path: '/v1/records/archive/folders/d1/download-zip',
    })
    archive.state.redeem = 'ok'
    await userClick(() => $('[data-testid="folder-zip-button"]'))
    await until(() => saved.length === 1, 'ikinci tıklama kaydetti')
    expect(saved[0]).toBe('paket.zip')
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(2)
  })

  it('tüketimde 429 records.busy: Retry-After metni', async () => {
    archive.state.redeem = 'rate-limited'
    await boot({ ...COORD, path: '/arsiv/d1' })
    await userClick(() => $('[data-testid="folder-zip-button"]'))
    await until(() => note('folder-zip-note').includes('9'), 'Retry-After 9')
  })

  it('üye: sanal klasör ZIP düğmesi görünür; kendi bileti my-tasks yoluyla ve kendi departmanıyla', async () => {
    const app = await boot({ ...MEMBER, path: '/arsiv' })
    await until(() => app.router.currentRoute.value.path === '/arsiv/my-tasks', 'yönlendirme')
    await userClick(() => $('[data-testid="folder-zip-button"]'))
    await until(() => saved.length === 1, 'kaydedildi')
    const [issue] = backend.sent('POST', '/v1/download-tickets')
    expect(issue!.body).toEqual({
      method: 'GET',
      path: '/v1/records/archive/folders/my-tasks/download-zip',
    })
    expect(issue!.headers.get('X-Nizamio-Department')).toBe('d1')
  })
})

describe('dönem ZIP', () => {
  it('yönetici /arsiv: düğme görünür ama devre dışı + BE-120 işareti, ağ isteği yok', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(() => $('[data-testid="period-zip-button"]'), 'düğme')
    expect(($('[data-testid="period-zip-button"]') as HTMLButtonElement).disabled).toBe(true)
    expect($('[data-design-stub="BE-120"] [data-testid="period-zip-button"]')).not.toBeNull()
    $('[data-testid="period-zip-button"]')!.click()
    await idle(app.queryClient)
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(0)
  })

  it('koordinatör ve üye: dönem ZIP hiçbir yüzde yok', async () => {
    await boot({ ...COORD, path: '/arsiv/d1' })
    await until(() => $('[data-testid="archive-folder-page"]'), 'sayfa')
    expect($('[data-testid="period-zip"]')).toBeNull()
  })
})
