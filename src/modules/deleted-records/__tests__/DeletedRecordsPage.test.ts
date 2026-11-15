import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  account,
  department,
  meeting,
  mountPage,
  PATHS,
  resetAll,
  sent,
  server,
  serverDefaults,
  settle,
  standingHandlers,
  task,
  world,
} from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  server.use(...serverDefaults())
  world.dictionary = [
    { department_id: 'd1', display_name: 'Mekanik', code: 'MEK' },
    { department_id: 'd2', display_name: 'Yazılım', code: 'YAZ' },
  ]
})
afterEach(resetAll)
afterAll(() => server.close())

describe('12 Silinen kayıtlar — yetki kapısı (P36)', () => {
  it('yönetici olmayan: sayfa içeriği yok, silinen uçları çağrılmaz, ana sayfaya dön bağlantısı', async () => {
    server.use(
      ...standingHandlers({
        companyAdmin: false,
        rows: [{ department_id: 'd1', role: 'koordinator' }],
      }),
    )
    const page = await mountPage()
    expect(page.wrapper.find('[data-testid="deleted-records-denied"]').exists()).toBe(true)
    expect(page.wrapper.find('[data-testid="deleted-records-page"]').exists()).toBe(false)
    expect(page.wrapper.text()).toContain('Bu sayfayı görüntüleme yetkiniz yok.')
    for (const path of [PATHS.tasks, PATHS.meetings, PATHS.departments, PATHS.accounts]) {
      expect(sent(path), path).toHaveLength(0)
    }
    expect(page.wrapper.get('a').attributes('href')).toBe('/')
  })

  it('yönetici Koordinatör merceğinde de ekranı görür (mercek yetki değildir, P1)', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage({
      scope: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
    })
    expect(page.wrapper.find('[data-testid="deleted-records-page"]').exists()).toBe(true)
    expect(page.wrapper.findAll('[data-record-key]')).toHaveLength(1)
  })

  it('sunucu 403 (yetki sonradan alınmış): yetkisiz durumu', async () => {
    world.admin = false
    const page = await mountPage()
    expect(page.wrapper.find('[data-testid="deleted-records-denied"]').exists()).toBe(true)
  })
})

describe('sekmeler ve uçlar (P41, P42)', () => {
  it('yalnız açık sekmenin ucu çağrılır; "Tümü" yok; devre dışı türler tıklanamaz', async () => {
    world.tasks = [[task('w1', { title: 'Saha pano montajı' })]]
    const page = await mountPage()
    expect(sent(PATHS.tasks)).toHaveLength(1)
    for (const path of [PATHS.meetings, PATHS.departments, PATHS.accounts]) {
      expect(sent(path), path).toHaveLength(0)
    }
    const labels = page.wrapper
      .findAll('[data-testid="dr-kinds"] button')
      .map((b) => b.attributes('data-kind'))
    expect(labels).toEqual([
      'gorev',
      'toplanti',
      'koordinatorluk',
      'kullanici',
      'altgorev',
      'dosya',
      'notgundem',
    ])
    expect(page.wrapper.get('[data-testid="dr-kinds"]').text()).not.toContain('Tümü')
    for (const kind of ['altgorev', 'dosya', 'notgundem']) {
      const button = page.wrapper.get(`[data-kind="${kind}"]`)
      expect(button.attributes('disabled')).toBeDefined()
      await button.trigger('click')
    }
    await settle()
    expect(page.router.currentRoute.value.query.tur).toBeUndefined()
    expect(sent(PATHS.meetings)).toHaveLength(0)
  })

  it('varsayılan Görev; tür değişince yalnız o türün ucu çağrılır ve URL tur yazılır', async () => {
    world.tasks = [[task('w1')]]
    world.meetings = [[meeting('m1')]]
    world.departments = [[department('d5')]]
    world.accounts = [[account('a1')]]
    const page = await mountPage()
    for (const [kind, path] of [
      ['toplanti', PATHS.meetings],
      ['koordinatorluk', PATHS.departments],
      ['kullanici', PATHS.accounts],
    ] as const) {
      await page.wrapper.get(`[data-kind="${kind}"]`).trigger('click')
      await settle()
      expect(page.router.currentRoute.value.query.tur).toBe(kind)
      expect(sent(path), kind).toHaveLength(1)
    }
    await page.wrapper.get('[data-kind="gorev"]').trigger('click')
    await settle()
    expect(page.router.currentRoute.value.query.tur).toBeUndefined()
    // Önceki türün listesi önbellekte kalır (anında görünür) ve arka planda yeniden doğrulanır.
    expect(page.wrapper.findAll('[data-record-key]')).toHaveLength(1)
    expect(sent(PATHS.tasks).length).toBeGreaterThanOrEqual(1)
    expect(sent(PATHS.meetings)).toHaveLength(1)
  })

  it('S2 uçları program başlığı taşır; hesap ucu (S1) taşımaz', async () => {
    world.accounts = [[account('a1')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=kullanici' })
    expect(sent(PATHS.accounts)[0]!.headers.get('X-Nizamio-Program')).toBeNull()
    expect(sent(PATHS.accounts)[0]!.query.get('limit')).toBe('200')
    await page.wrapper.get('[data-kind="gorev"]').trigger('click')
    await settle()
    expect(sent(PATHS.tasks)[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(sent(PATHS.tasks)[0]!.headers.get('X-Nizamio-Department')).toBeNull()
  })

  it('devre dışı tür URL değeri tanınmaz: Görev açılır', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=dosya' })
    expect(page.wrapper.get('[data-kind="gorev"]').attributes('aria-pressed')).toBe('true')
    expect(sent(PATHS.tasks)).toHaveLength(1)
  })
})

describe('sayaç, alt başlık ve notlar', () => {
  it('sayaçlar özetten ve kesin: dört tür de sayı gösterir, "n+" ve "yüklenen kayıtlar içinde" yok (BE-110)', async () => {
    world.tasks = [[task('w1'), task('w2')], [task('w3')]]
    world.meetings = [[meeting('m1')]]
    world.accounts = [[account('a1'), account('a2')]]
    const page = await mountPage()
    const counts = page.wrapper.findAll('[data-testid="dr-kinds"] .rp-count')
    expect(counts.map((c) => c.text())).toEqual(['3', '1', '0', '2'])
    expect(page.wrapper.get('[data-testid="dr-sub"]').text()).toBe(
      '3 görev · yalnız yönetici görür',
    )
    // Özet S2: program başlığı taşır, süzgeç almaz.
    const summary = sent(PATHS.summary)
    expect(summary).toHaveLength(1)
    expect(summary[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect([...summary[0]!.query.keys()]).toEqual([])
    // Alt sayaç satırı süzülmüş listenin total'idir: "m / toplam".
    expect(page.wrapper.get('[data-testid="dr-count"]').text()).toBe('2 / 3 kayıt gösteriliyor')
    await page.wrapper.get('[data-testid="dr-more"]').trigger('click')
    await settle()
    expect(page.wrapper.get('[data-testid="dr-count"]').text()).toBe('3 kayıt')
    expect(page.wrapper.find('[data-testid="dr-more"]').exists()).toBe(false)
    expect(sent(PATHS.tasks)[1]!.query.get('cursor')).toBe('1')
    expect(page.wrapper.text()).not.toMatch(/içinde|\d\+/)
  })

  it('süzgeç özet sayaçlarını değiştirmez; alt sayaç süzülmüş küme boyunu gösterir', async () => {
    world.tasks = [[task('w1', { title: 'Motor' }), task('w2', { title: 'Şasi' })]]
    const page = await mountPage({ path: '/silinen-kayitlar?q=motor' })
    expect(page.wrapper.get('[data-testid="dr-kinds"] [data-kind="gorev"] .rp-count').text()).toBe(
      '2',
    )
    expect(page.wrapper.get('[data-testid="dr-count"]').text()).toBe('1 kayıt')
    expect(sent(PATHS.summary)).toHaveLength(1)
    expect(sent(PATHS.summary)[0]!.query.has('q')).toBe(false)
  })

  it('özet okunamazsa sayaç çizilmez (sahte sayı yok); liste yine çalışır', async () => {
    world.tasks = [[task('w1')]]
    world.failures.set(`GET ${PATHS.summary}`, { status: 500, code: 'platform.internal' })
    const page = await mountPage()
    expect(page.wrapper.find('[data-testid="dr-kinds"] .rp-count').exists()).toBe(false)
    expect(page.wrapper.get('[data-testid="dr-sub"]').text()).toBe('Yalnız yönetici görür')
    expect(page.wrapper.findAll('[data-record-key]')).toHaveLength(1)
  })

  it('saklama metni P37, iz kaydı cümlesi bağlantısız; kalan süre ve "Yakında" kartı yok', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage()
    expect(page.wrapper.get('[data-testid="dr-retention"]').text()).toBe(
      'Silinen kayıtlar bir yönetici kalıcı olarak silene kadar saklanır.',
    )
    const trace = page.wrapper.get('[data-testid="dr-trace"]')
    expect(trace.text()).toContain('işlem geçmişine kaydedilir')
    expect(trace.find('a').exists()).toBe(false)
    const text = page.wrapper.text()
    expect(text).not.toContain('kalan süre')
    expect(text).not.toContain('Yakında kalıcı silinecek')
    expect(text).not.toContain('gün saklanır')
  })

  it('Koordinatörlük sekmesi scope=program ile çağrılır; "şirket geneli ≠ sayaç" notu yok, scope=company sunulmaz (BE-119)', async () => {
    world.departments = [[department('d5')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=koordinatorluk' })
    const request = sent(PATHS.departments)[0]!
    expect(request.query.get('scope')).toBe('program')
    expect(request.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(page.wrapper.find('[data-testid="dr-mismatch"]').exists()).toBe(false)
    expect(page.wrapper.text()).not.toMatch(
      /şirket genelindeki silinmiş koordinatörlük|iki sayı farklı/,
    )
    expect(sent(PATHS.departments).every((r) => r.query.get('scope') === 'program')).toBe(true)
  })
})

describe('statik başlık eylemleri ve toplu seçim', () => {
  it('CSV indir ve Çöpü boşalt devre dışı + designStub; kalan süre yok; sıralama stub değil', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage()
    const csv = page.wrapper.get('[data-testid="dr-csv"]')
    const trash = page.wrapper.get('[data-testid="dr-empty-trash"]')
    expect(csv.attributes('disabled')).toBeDefined()
    expect(trash.attributes('disabled')).toBeDefined()
    expect(page.wrapper.get('[data-design-stub="BE-116"]').element.contains(csv.element)).toBe(true)
    expect(page.wrapper.get('[data-design-stub="BE-115"]').element.contains(trash.element)).toBe(
      true,
    )
    // Seçim kutuları vardır (BE-114) ama seçim yokken toplu çubuk çizilmez.
    expect(page.wrapper.find('[data-testid="dr-select-all"]').exists()).toBe(true)
    expect(page.wrapper.find('[role="toolbar"]').exists()).toBe(false)
    expect(page.wrapper.find('[data-design-stub="BE-117"]').exists()).toBe(false)
    expect(page.wrapper.find('[aria-sort="descending"]').exists()).toBe(true)
  })
})
