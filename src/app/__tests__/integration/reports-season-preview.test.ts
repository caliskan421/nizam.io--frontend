// W142 · O3 senaryo 1 (c): 01f dönem raporu önizlemesi — yalnız sayfa açılınca okunur, canlı bölümler
// veriden, statik bölümler stub (sahte sayı yok), yükleniyor/boş/hata/429/503, "Kapat" → Arşiv + odak.
import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

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
  it('BE-123: Gantt tasks[]’ten çizilir (stub ve ok yok); görev satırları ve çubuklar', async () => {
    await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
    await until(STAGE, 'önizleme')
    const gantt = $('[data-testid="gantt"]')!
    expect(gantt).not.toBeNull()
    expect($$('[data-gantt-task]', gantt).map((r) => r.getAttribute('data-gantt-task'))).toEqual([
      'w2',
      'w3',
      'w1',
    ])
    expect($$('.report-gantt__bar', gantt).length).toBeGreaterThanOrEqual(3)
    expect($('#report-season-gantt [data-design-stub]')).toBeNull()
    expect($('#report-season-gantt [data-placeholder]')).toBeNull()
    expect($('#report-season-gantt')!.textContent).toContain('ALT-7')
    // Bölüm içi sıra: koordinatörlük sıra numarası (BE-005), oluşturulma anı değil.
  })

  it("BE-136: kapak dönem aralığı, bölüm detay kartı, toplantı, dosya ve ortalama kayma gerçek JSON'dan; boş dönemde aralık ve kartlar yok", async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
    await until(STAGE, 'önizleme')
    const text = (sel: string) => $(sel)?.textContent ?? ''
    expect(text('#report-season-cover')).toContain('01.09.2026 – 17.10.2026')
    expect(text('#report-season-dept-d1 [data-detail="w1"]')).toContain('Ana dağıtım panolarından')
    expect(text('#report-season-dept-d1 [data-detail="w1"]')).toContain('Onay bekliyor')
    expect(text('#report-season-dept-d1 [data-meeting="m1"]')).toContain('GÜNDEM 4/6')
    expect(text('#report-season-dept-d1 [data-testid="dept-files"]')).toContain(
      'saha-kablo-kanali-plan-v3.pdf',
    )
    expect(text('#report-season-general')).toContain('Onaylananlarda ortalama kayma: 4,2 gün')
    expect(text('#report-season-dept-d1')).toContain('ALT-7')
    expect($('[data-design-stub="BE-136"]')).toBeNull()
    teardown()
    reports.state.season = 'empty'
    await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
    await until(STAGE, 'boş dönem önizlemesi')
    expect(text('#report-season-cover')).not.toContain('01.09.2026')
    expect($('[data-testid="cover-period-note"]')).toBeNull()
    expect($('[data-detail]')).toBeNull()
    expect($('[data-meeting]')).toBeNull()
    expect($('[data-testid="top-requested"]')).toBeNull()
    await idle(app.queryClient)
  })

  it("BE-134: iş yükü satırları reportSeason.workload_summary'den; ikinci okuma (reportWorkload) ve stub yok; boş dönemde metin", async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
    await until(STAGE, 'önizleme')
    const rows = Array.from(document.querySelectorAll('[data-testid="workload-row"]'))
    expect(rows.map((r) => r.querySelector('strong')?.textContent)).toEqual([
      'Bahar Kılıç',
      'Kadir Özbek',
    ])
    expect(document.querySelector('[data-design-stub="BE-134"]')).toBeNull()
    expect(backend.sent('GET', '/v1/reports/workload')).toHaveLength(0)
    expect(backend.sent('POST', '/v1/reports/workload')).toHaveLength(0)
    expect(sent()).toHaveLength(1)
    teardown()
    reports.state.season = 'empty'
    await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
    await until(() => $('[data-testid="workload"]'), 'iş yükü bölümü')
    expect($('[data-testid="workload"]')!.textContent).toContain('İş yükü verisi bulunamadı.')
    await idle(app.queryClient)
  })

  it('BE-132: kesilmiş büyük dönem "gösterilen N / toplam M" uyarısı çizer; tam dönemde uyarı yok', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
    await until(STAGE, 'önizleme')
    expect($('[data-testid="season-truncated"]')).toBeNull()
    teardown()
    reports.state.season = 'truncated'
    await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
    const note = await until(() => $('[data-testid="season-truncated"]'), 'kesme uyarısı')
    expect(note.textContent).toContain('görev 3 / 5200 gösteriliyor.')
    expect(note.textContent).toContain('dosya 1 / 2400 gösteriliyor.')
    await idle(app.queryClient)
  })

  // CX-F6-E-05: başlıklı 429 ortak sayacı başlatır; sayaç boyunca önizleme tekrarı ve PDF düğmesi
  // kapalı, süre bitince otomatik istek yok (süre dolumu ve otomatik istek yokluğu `queries.test.ts`'te sahte saatle).
  it.each(['export_in_progress', 'rate_limited', 'capacity_full'] as const)(
    '%s (Retry-After): sayaç boyunca "Yeniden dene" ve "PDF indir" kapalı, ek istek yok',
    async (mode) => {
      reports.state.season = mode
      const app = await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
      await until(() => document.body.textContent?.includes('Dönem raporu okunamadı'), 'hata')
      await idle(app.queryClient)
      const retry = () => byText('button', 'Yeniden dene') as HTMLButtonElement | null
      const pdf = () => $('[data-testid="preview-pdf"] button') as HTMLButtonElement | null
      await until(() => retry()?.disabled && pdf()?.disabled, 'tekrar ve PDF kapalı')
      expect(document.body.textContent).toContain('Bekleyin (')
      retry()!.click()
      pdf()!.click()
      await flushPromises()
      await idle(app.queryClient)
      expect(sent()).toHaveLength(1)
      expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(0)
    },
  )

  // CX-F6-E-08: sayaç sürerken "Kapat" → Arşiv → "Önizle" ağır GET başlatmaz; sayaç bitince
  // otomatik istek yok; açık "Yeniden dene" tek istektir.
  it('429 sayacı sürerken önizlemeyi kapatıp yeniden açmak ikinci GET başlatmaz; süre dolunca otomatik istek yok; "Yeniden dene" tek istek', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    try {
      reports.state.season = 'rate_limited'
      const app = await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
      await until(() => document.body.textContent?.includes('Dönem raporu okunamadı'), 'hata')
      await idle(app.queryClient)
      expect(sent()).toHaveLength(1)
      reports.state.season = 'ok'

      await userClick('[data-action="close"]')
      await until(() => $('[data-action="preview-season"]'), 'arşiv')
      await userClick('[data-action="preview-season"]')
      await until(() => document.body.textContent?.includes('Dönem raporu okunamadı'), 'hata')
      await idle(app.queryClient)
      expect(sent()).toHaveLength(1)
      expect(document.body.textContent).toContain('Bekleyin (')
      const retry = () => byText('button', 'Yeniden dene') as HTMLButtonElement | null
      expect(retry()!.disabled).toBe(true)
      expect(STAGE()).toBeNull()

      await vi.advanceTimersByTimeAsync(61_000)
      await idle(app.queryClient)
      expect(document.body.textContent).not.toContain('Bekleyin (')
      expect(sent()).toHaveLength(1)
      expect(retry()!.disabled).toBe(false)

      await userClick(() => retry())
      await until(STAGE, 'yeniden okundu')
      expect(sent()).toHaveLength(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('başlıksız 503 (capacity_full): sayaç yok, "Yeniden dene" açık', async () => {
    reports.state.season = 'capacity_bare'
    await boot({ ...ADMIN, path: '/arsiv/donem-raporu' })
    await until(() => byText('button', 'Yeniden dene'), 'hata')
    expect(document.body.textContent).not.toContain('Bekleyin (')
    expect((byText('button', 'Yeniden dene') as HTMLButtonElement).disabled).toBe(false)
  })

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
    // Pin v0.23.0-api: önizlemede statik yer tutucu kalmadı (BE-123/134/136); eski yol yok.
    expect($$('[data-design-stub]', STAGE()!)).toHaveLength(0)
    expect($$('[data-placeholder]', STAGE()!)).toHaveLength(0)
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
    ['capacity_bare', 'Dönem raporu okunamadı'],
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
