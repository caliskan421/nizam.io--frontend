// W142 · O3 senaryo 1 (c): 01f dönem raporu önizlemesi — yalnız sayfa açılınca okunur, canlı bölümler
// veriden, statik bölümler stub (sahte sayı yok), yükleniyor/boş/hata/429/503, "Kapat" → Arşiv + odak.
import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  ADMIN,
  boot,
  byText,
  click,
  COORD,
  hold,
  idle,
  reports,
  resetReports,
  teardown,
  toasts,
  until,
  useReportsBackend,
  userClick,
} from './reports-support'

const backend = useReportsBackend({ coordinator: 'koordinator', member: 'uye' })
const STAGE = () => $('[data-testid="season-stage"]')
const sent = () => backend.sent('GET', '/v1/reports/season')

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetReports()
  await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
  await until(STAGE, 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => resetReports())
afterEach(() => teardown())
afterAll(() => backend.server.close())

describe('önizleme okuması', () => {
  it('reportSeason yalnız sayfa açılınca okunur: Arşiv sayfası okumaz, "Önizle" okutur', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(() => byText('button', 'Dönem sonu raporu (PDF)'), 'arşiv')
    await idle(app.queryClient)
    expect(sent()).toHaveLength(0)
    await userClick('[data-action="preview-season"]')
    await until(STAGE, 'önizleme')
    expect(app.router.currentRoute.value.path).toBe('/arsiv/donem-raporu')
    expect(sent()).toHaveLength(1)
    expect(sent()[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
  })

  it('canlı bölümler veriden (program adı, dağılım, görev tablosu); statik bölümler stub ve sahte sayı yok', async () => {
    await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
    await until(STAGE, 'önizleme')
    const text = STAGE()!.textContent ?? ''
    expect(text).toContain('Teknofest 2026')
    expect(text).toContain('Kablo kanalı kazısı')
    expect(text).toContain('Hidrant hattı')
    expect(text).toContain('Başlamadı')
    // Statik bölümler: yer tutucu, DesignStub işareti.
    const stubs = $$('[data-design-stub]', STAGE()!).map((el) =>
      el.getAttribute('data-design-stub'),
    )
    expect(stubs).toEqual(expect.arrayContaining(['BE-123', 'BE-134', 'BE-136']))
    expect($$('[data-placeholder]', STAGE()!).length).toBeGreaterThan(0)
    // Pdf düğmesi ve yakınlaştırma araç çubuğunda; "Yazdır" ve sayfa göstergesi yok.
    expect(byText('button', 'PDF indir')).not.toBeNull()
    expect(byText('button', 'Yazdır')).toBeNull()
    expect(document.body.textContent).not.toMatch(/Sayfa \d+ \/ \d+/)
  })

  it('yakınlaştırma %50–%200 sınırında düğmeleri devre dışı bırakır', async () => {
    await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
    await until(STAGE, 'önizleme')
    const zoom = () => $('[data-testid="zoom-value"]')!.textContent
    for (let i = 0; i < 2; i += 1) await click('[data-action="zoom-out"]')
    await until(() => zoom() === '%50', '%50')
    expect(($('[data-action="zoom-out"]') as HTMLButtonElement).disabled).toBe(true)
    for (let i = 0; i < 6; i += 1) await click('[data-action="zoom-in"]')
    await until(() => zoom() === '%200', '%200')
    expect(($('[data-action="zoom-in"]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('yükleniyor: kâğıt iskeleti + "Rapor hazırlanıyor…" (sahte değer yok); bitince canlı', async () => {
    const gate = hold('GET', '/v1/reports/season')
    await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
    await gate.arrived
    await until(() => document.body.textContent?.includes('Rapor hazırlanıyor'), 'yükleniyor')
    expect($('[data-testid="season-report"] [aria-busy="true"]')).not.toBeNull()
    expect(STAGE()).toBeNull()
    gate.release()
    await until(STAGE, 'canlı')
  })

  it('boş dönem: kâğıt yine çizilir, PDF indirilebilir', async () => {
    reports.state.season = 'empty'
    await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
    await until(STAGE, 'boş dönem')
    expect(byText('button', 'PDF indir')).not.toBeNull()
    expect(STAGE()!.textContent).toMatch(/bulunamadı/i)
  })

  it.each([
    ['error', 'Dönem raporu okunamadı'],
    ['export_in_progress', 'Dönem raporu okunamadı'],
    ['rate_limited', 'Dönem raporu okunamadı'],
    ['capacity_full', 'Dönem raporu okunamadı'],
  ] as const)('%s: bölge içi hata + "Yeniden dene", otomatik tekrar yok', async (mode, title) => {
    reports.state.season = mode
    const app = await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
    await until(() => document.body.textContent?.includes(title), 'hata')
    await idle(app.queryClient)
    expect(sent()).toHaveLength(1)
    expect(STAGE()).toBeNull()
    reports.state.season = 'ok'
    await userClick(() => byText('button', 'Yeniden dene'))
    await until(STAGE, 'yeniden okundu')
    expect(sent()).toHaveLength(2)
  })

  it('önizleme okuması sürerken "PDF indir" kilitli (aynı reportGate); okuma bitince açılır', async () => {
    const gate = hold('GET', '/v1/reports/season')
    await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
    await gate.arrived
    const pdf = () => $('[data-testid="preview-pdf"] button') as HTMLButtonElement | null
    await until(() => pdf()?.disabled, 'kilitli')
    expect(pdf()!.textContent).toContain('PDF indir')
    expect(document.body.textContent).toContain('Bu sırada diğer rapor düğmeleri kilitli')
    pdf()!.click()
    await flushPromises()
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(0)
    gate.release()
    await until(STAGE, 'okundu')
    await until(() => pdf()?.disabled === false, 'kilit açıldı')
  })
})

describe('gezinme ve yetki', () => {
  it('"Kapat" Arşiv\'e döner ve odak "Önizle" bağlantısına gider', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await userClick('[data-action="preview-season"]')
    await until(STAGE, 'önizleme')
    await userClick('[data-action="close"]')
    await until(
      () =>
        app.router.currentRoute.value.path.startsWith('/arsiv') &&
        $('[data-action="preview-season"]'),
      'arşiv',
    )
    await until(() => document.activeElement === $('[data-action="preview-season"]'), 'odak')
  })

  it('koordinatör adresi yazarsa önizleme okunmaz; ana sayfaya döner + erişim yok bildirimi', async () => {
    const app = await boot({ ...COORD, path: '/arsiv/donem-raporu' })
    await until(() => app.router.currentRoute.value.name === 'home', 'ana sayfaya yönlendi')
    await until(() => toasts().length > 0, 'bildirim')
    await idle(app.queryClient)
    expect(sent()).toHaveLength(0)
    expect(STAGE()).toBeNull()
  })

  it('yönetici K merceğinde de önizlemeye girer (yetki olgu, mercek değil; P1)', async () => {
    await boot({
      ...ADMIN,
      scope: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
      path: '/arsiv/donem-raporu',
    })
    await until(STAGE, 'önizleme')
  })
})
