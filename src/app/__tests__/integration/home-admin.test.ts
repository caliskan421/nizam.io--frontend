// W142 · O3 senaryo 5 (a): 01 yönetici ana sayfası — "Rapor oluştur" menüsü (4 yönlendirme, ağ isteği
// yok, odak dönüşü), ekip şeridi / koordinatörlük kartları tek `reportDashboard` okumasından,
// arama/süzgeç/sıralama, K/Ü merceğinde program geneli (P53). W137 TASLAK: RoleHomeDraft → K1/Ü1 gerçek.
import { http } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { envelope } from './fake-org'
import {
  $,
  $$,
  ADMIN,
  boot,
  byText,
  COORD,
  fill,
  idle,
  MEMBER,
  resetReports,
  teardown,
  until,
  useReportsBackend,
  userClick,
} from './reports-support'

const backend = useReportsBackend({ coordinator: 'koordinator', member: 'uye' })
const TILE = () => $('[data-quick="report"]') as HTMLButtonElement | null
const MENU = () => $('.home-report__menu')
const ITEMS = () => $$('[data-report]').map((el) => el.getAttribute('data-report'))

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetReports()
  await boot({ ...ADMIN, path: '/' })
  await until(TILE, 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => resetReports())
afterEach(() => teardown())
afterAll(() => backend.server.close())

const press = (el: Element, key: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

describe('Rapor oluştur menüsü', () => {
  it('yönetici: kutucuk menüyü açar; dört seçenek tasarım sırasında; menü ağ isteği atmaz', async () => {
    const app = await boot({ ...ADMIN, path: '/' })
    await until(TILE, 'kutucuk')
    await idle(app.queryClient)
    const before = backend.requests.length
    expect(TILE()!.getAttribute('aria-haspopup')).toBe('menu')
    expect(TILE()!.getAttribute('aria-controls')).toBeNull()
    await userClick(TILE)
    await until(MENU, 'menü')
    expect(TILE()!.getAttribute('aria-expanded')).toBe('true')
    expect(TILE()!.getAttribute('aria-controls')).toBe(MENU()!.id)
    expect(ITEMS()).toEqual(['season', 'workload', 'meeting', 'task'])
    expect(backend.requests.length).toBe(before)
  })

  it.each([
    ['season', '/arsiv'],
    ['workload', '/kullanicilar'],
    ['meeting', '/toplantilar'],
    ['task', '/gorevler'],
  ])('"%s" yalnız gezinir: %s; PDF bileti üretilmez', async (key, path) => {
    const app = await boot({ ...ADMIN, path: '/' })
    await userClick(TILE)
    await userClick(`[data-report="${key}"]`)
    await until(() => app.router.currentRoute.value.path.startsWith(path), 'gezinti')
    await idle(app.queryClient)
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(0)
    expect(
      backend.requests.filter(
        (r) => r.path.startsWith('/v1/reports/') && r.path !== '/v1/reports/dashboard',
      ),
    ).toHaveLength(0)
  })

  it('Esc menüyü kapatır ve odak kutucuğa döner; aria-controls kalkar', async () => {
    await boot({ ...ADMIN, path: '/' })
    await userClick(TILE)
    await until(MENU, 'menü')
    press(MENU()!, 'Escape')
    await until(() => !MENU(), 'kapandı')
    expect(document.activeElement).toBe(TILE())
    expect(TILE()!.getAttribute('aria-controls')).toBeNull()
    expect(TILE()!.getAttribute('aria-expanded')).toBe('false')
  })

  it('dış tıklama menüyü kapatır ve odağı çalmaz', async () => {
    await boot({ ...ADMIN, path: '/' })
    await userClick(TILE)
    await until(MENU, 'menü')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await until(() => !MENU(), 'kapandı')
    expect(document.activeElement).not.toBe(TILE())
  })

  it('yönetici K merceğinde de kutucuğu görür (yetki olgu; P1)', async () => {
    await boot({ ...ADMIN, scope: COORD.scope, path: '/' })
    await until(TILE, 'kutucuk')
  })

  it.each([
    ['koordinatör (K1)', COORD],
    ['üye (Ü1)', MEMBER],
  ])('%s: kutucuk yok (P53)', async (_n, who) => {
    const app = await boot({ ...who, path: '/' })
    await until(() => $('[data-testid="home-page"]'), 'ana sayfa')
    await idle(app.queryClient)
    expect(TILE()).toBeNull()
    expect($('[data-report]')).toBeNull()
  })
})

describe('yönetici bölgeleri (reportDashboard)', () => {
  it('ekip şeridi ve koordinatörlük kartları dashboard alanlarından; dashboard TEK kez okunur', async () => {
    const app = await boot({ ...ADMIN, path: '/' })
    await until(() => $('[data-team-users]'), 'ekip şeridi')
    await until(() => $('[data-region="coords"]')?.textContent?.includes('Yazılım'), 'kartlar')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/reports/dashboard')).toHaveLength(1)
    expect($('[data-team-users]')!.textContent).toBe('5')
    expect($$('[data-role]')).toHaveLength(3)
    expect($('[data-region="coords"]')!.textContent).toContain('Mekanik')
    expect($('[data-region="coords"]')!.textContent).toContain('Yazılım')
  })

  it('arama süzer: "mek" yalnız Mekanik kartını bırakır; sonuç yoksa boş durum', async () => {
    const app = await boot({ ...ADMIN, path: '/' })
    await until(() => $('[data-region="coords"]')?.textContent?.includes('Yazılım'), 'kartlar')
    await fill('[data-region="coords-toolbar"] input[type="search"]', 'mek')
    await until(() => !$('[data-region="coords"]')!.textContent.includes('Yazılım'), 'süzüldü')
    expect($('[data-region="coords"]')!.textContent).toContain('Mekanik')
    await fill('[data-region="coords-toolbar"] input[type="search"]', 'zzz')
    await until(
      () => $('[data-region="coords"]')!.textContent.includes('eşleşen koordinatörlük yok'),
      'boş',
    )
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/reports/dashboard')).toHaveLength(1)
  })

  it('yönetici K merceğinde program geneli kalır (P53): yönetici sayfası + ekip şeridi; KPI birim sayaçları', async () => {
    await boot({ ...ADMIN, scope: COORD.scope, path: '/' })
    await until(() => $('[data-home="admin"]'), 'yönetici sayfası')
    await until(() => $('[data-team-users]'), 'ekip şeridi')
    expect($('[data-region="coords"]')!.textContent).toContain('Yazılım')
    expect($('[data-home="k1"]')).toBeNull()
  })

  it('dashboard 403 (yetki düştü): bölgeler bölge içi hata + "Yeniden dene", sayfa düşmez', async () => {
    backend.server.use(
      http.get('http://localhost/v1/reports/dashboard', () =>
        envelope('reporting.not_authorized', 403),
      ),
    )
    await boot({ ...ADMIN, path: '/' })
    await until(() => byText('[data-region="team"] button', 'Yeniden dene'), 'bölge hatası')
    expect($('[data-testid="home-greeting"]')).not.toBeNull()
    expect(byText('[data-region="coords"] button', 'Yeniden dene')).not.toBeNull()
  })
})
