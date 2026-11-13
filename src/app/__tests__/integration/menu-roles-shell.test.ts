// W142 · O3 senaryo 6: rol menüleri (gerçek kabuk) — üç rol × menü öğeleri ve rozetler; mercek
// değişiminde yönetici menüsü sabit; "Raporlar" öğesi ve `/raporlar` rotası hiçbir rolde yok
// (P47, E-13-76); 390 px'te kabuk menüsü gerçek tıklama + odak.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  $$,
  ADMIN,
  boot,
  click,
  COORD,
  idle,
  MEMBER,
  resetReports,
  switchScope,
  teardown,
  until,
  useReportsBackend,
} from './reports-support'

const backend = useReportsBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetReports()
  await boot({ ...ADMIN, path: '/' })
  await until(() => $('nav [data-group]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  resetReports()
  // w1 gecikmiş + onayda: koordinatör (onay + geciken), yönetici (geciken) rozetleri dolsun.
  const w1 = backend.db.items.find((i) => i.work_item_id === 'w1')!
  Object.assign(w1, { status: 'onaya_sunuldu', end_on: '2026-11-05' })
})
afterEach(() => {
  vi.unstubAllGlobals()
  teardown()
})
afterAll(() => backend.server.close())

/** group → [etiket, ...] (rozet metinleri hariç). */
const menu = () =>
  Object.fromEntries(
    $$('nav [data-group]').map((g) => [
      g.dataset.group,
      $$('.t-nav__label', g).map((l) => l.textContent?.trim()),
    ]),
  )
const badge = (kind: string) =>
  $(`nav .side-badge[data-badge="${kind}"]`)?.textContent?.trim() ?? null

describe('rol menüleri', () => {
  it('yönetici: üç grup, rozet tarih talebi + geciken; "Raporlar" öğesi yok', async () => {
    const app = await boot({ ...ADMIN, path: '/' })
    await until(() => badge('overdue'), 'rozet')
    expect(menu()).toEqual({
      takip: ['Ana sayfa', 'Görevler', 'Zaman çizelgesi'],
      icerik: ['Toplantılar', 'Arşiv'],
      yonetim: ['Kullanıcılar', 'Koordinatörlükler', 'Teknofest ve sezon'],
    })
    expect(badge('overdue')).toBe('1')
    expect(badge('approval')).toBeNull()
    await idle(app.queryClient)
  })

  it('koordinatör: Yönetim yok; Görevler onay + geciken, Zaman çizelgesi tarih talebi rozeti', async () => {
    const app = await boot({ ...COORD, path: '/' })
    await until(() => badge('approval'), 'rozet')
    expect(Object.keys(menu())).toEqual(['takip', 'icerik'])
    expect(menu().takip).toContain('Görevler')
    expect(badge('approval')).toBe('1')
    expect(badge('overdue')).toBe('1')
    await idle(app.queryClient)
  })

  it('üye: kendi adlarıyla öğeler; yalnız kendi gecikenleri rozeti, onay/tarih rozeti yok', async () => {
    const app = await boot({ ...MEMBER, path: '/' })
    await until(() => badge('overdue'), 'rozet')
    expect(Object.keys(menu())).toEqual(['takip', 'icerik'])
    expect(menu().takip).toEqual(['Ana sayfa', 'Görevlerim', 'Zaman çizelgem'])
    expect(menu().icerik).toEqual(['Toplantılar', 'Dosyalarım'])
    expect(badge('approval')).toBeNull()
    expect(badge('dates')).toBeNull()
    await idle(app.queryClient)
  })

  it('yönetici K/Ü merceğine geçince menü sabit kalır (mercek ≠ yetki; P1)', async () => {
    const app = await boot({ ...ADMIN, path: '/' })
    await until(() => menu().yonetim, 'yönetim grubu')
    const before = menu()
    await switchScope('Rol', 'Koordinatör')
    await until(() => app.scope.lens === 'coordinator', 'mercek')
    await idle(app.queryClient)
    expect(menu()).toEqual(before)
    expect(Object.keys(menu())).toContain('yonetim')
  })

  it.each([
    ['yönetici', ADMIN],
    ['koordinatör', COORD],
    ['üye', MEMBER],
  ])('%s: "Raporlar" menü öğesi yok; /raporlar rotası kayıtlı değil', async (_n, who) => {
    const app = await boot({ ...who, path: '/' })
    await until(() => $('nav [data-group]'), 'menü')
    await idle(app.queryClient)
    expect($$('nav a').some((a) => /rapor/i.test(a.textContent ?? ''))).toBe(false)
    expect($$('nav a').some((a) => a.getAttribute('href')?.includes('rapor'))).toBe(false)
    // Yalnız "bulunamadı" yakalayıcısı eşleşir (rapor rotası yok).
    expect(app.router.resolve('/raporlar').matched.map((r) => r.path)).toEqual(['/:pathMatch(.*)*'])
  })
})

describe('390 px kabuk menüsü (gerçek tıklama + odak)', () => {
  function narrowScreen(): void {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: /max-width/.test(query),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }))
  }
  const trigger = () => $('[data-testid="topbar-menu"]') as HTMLButtonElement
  const side = () => $('aside#app-side')

  it('düğme menüyü açar, odak menüye girer; öğe tıklanınca gezinir ve menü kapanır', async () => {
    narrowScreen()
    const app = await boot({ ...ADMIN, path: '/' })
    await until(trigger, 'menü düğmesi')
    expect(side()!.classList.contains('rp-side--open')).toBe(false)
    trigger().focus()
    await click(trigger)
    await until(() => side()!.classList.contains('rp-side--open'), 'açıldı')
    await until(() => side()!.contains(document.activeElement), 'odak menüde')
    expect($('[data-testid="narrow-scrim"]')).not.toBeNull()
    await click(() => $$('nav a').find((a) => a.textContent?.includes('Arşiv')) ?? null)
    await until(() => app.router.currentRoute.value.path === '/arsiv', 'gezinti')
    await until(() => !side()!.classList.contains('rp-side--open'), 'kapandı')
    expect(document.documentElement.classList.contains('rp-scroll-lock')).toBe(false)
  })

  it('Esc menüyü kapatır ve odak tetikleyiciye döner', async () => {
    narrowScreen()
    await boot({ ...ADMIN, path: '/' })
    await until(trigger, 'menü düğmesi')
    trigger().focus()
    await click(trigger)
    await until(() => side()!.classList.contains('rp-side--open'), 'açıldı')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await until(() => !side()!.classList.contains('rp-side--open'), 'kapandı')
    await until(() => document.activeElement === trigger(), 'odak tetikleyicide')
  })

  it('perdeye tıklama menüyü kapatır; arka içerik açıkken etkisiz (inert)', async () => {
    narrowScreen()
    await boot({ ...ADMIN, path: '/' })
    await until(trigger, 'menü düğmesi')
    await click(trigger)
    await until(() => side()!.classList.contains('rp-side--open'), 'açıldı')
    expect($('main')!.hasAttribute('inert')).toBe(true)
    await click('[data-testid="narrow-scrim"]')
    await until(() => !side()!.classList.contains('rp-side--open'), 'kapandı')
    expect($('main')!.hasAttribute('inert')).toBe(false)
  })
})
