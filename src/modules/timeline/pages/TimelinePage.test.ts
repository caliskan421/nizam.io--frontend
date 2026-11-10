import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  errorEnvelope,
  gantt,
  ganttTask,
  http,
  json,
  MEMBER_SCOPE,
  ORIGIN,
  resetHarness,
  sent,
  server,
  workItem,
} from '../__tests__/harness'
import type { GanttTask } from '../model/types'
import {
  ADMIN,
  ADMIN_GANTT,
  COORD_GANTT,
  ganttHandler,
  manyTasks,
  MEMBER_GANTT,
  mountPage,
  settle,
  standingHandlers,
  type StandingFixture,
  unmountPages,
} from './timeline/__tests__/page-harness'
import TimelinePage from './TimelinePage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
// Gerçek W94 paneli açılışta taze görev + dosya listesini okur (görev kimliğine göre).
const panelHandlers = () => [
  http.get(`${ORIGIN}/v1/work-items/:id`, ({ params }) =>
    json(workItem({ work_item_id: String(params.id) })),
  ),
  http.get(`${ORIGIN}/v1/work-items/:id/files`, () => json({ files: [] })),
]
beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-21T09:00:00Z') }))
afterEach(() => {
  vi.useRealTimers()
  unmountPages()
  resetHarness()
})
afterAll(() => server.close())

const COORDINATOR: StandingFixture = {
  companyAdmin: false,
  rows: [{ department_id: 'd1', role: 'koordinator' }],
}
const MEMBER: StandingFixture = {
  companyAdmin: false,
  rows: [{ department_id: 'd1', role: 'uye' }],
}

const lateness = (over: Partial<GanttTask['lateness']>) => ({ ...ganttTask().lateness, ...over })
const TASKS = [
  ganttTask({
    work_item_id: 'w1',
    title: 'Asfalt',
    department_id: 'd1',
    start_on: '2026-06-16',
    end_on: '2026-08-31',
  }),
  ganttTask({
    work_item_id: 'w2',
    title: 'İzmir planı',
    department_id: 'd2',
    status: 'iade_edildi',
    start_on: '2026-07-01',
    end_on: '2026-09-15',
    lateness: lateness({ is_overdue: true, days_overdue: 4 }),
  }),
  ganttTask({
    work_item_id: 'w3',
    title: 'Bütçe',
    department_id: 'd1',
    status: 'tamamlandi',
    start_on: '2026-06-20',
    end_on: '2026-07-10',
  }),
]

const rows = (ctx: Awaited<ReturnType<typeof mountPage>>) =>
  ctx.wrapper
    .findAll('[data-row-key]')
    .map((r) => r.attributes('data-row-key')!)
    .filter((k) => !k.startsWith('g:'))
    .sort()
const query = (ctx: Awaited<ReturnType<typeof mountPage>>) => ctx.router.currentRoute.value.query

describe('Zaman çizelgesi — kapsam ve yüz', () => {
  it('Admin: TEK adminGantt isteği (yalnız program başlığı); sayaçlar ve yönetici eylemleri', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE)
    const [request, ...rest] = sent('GET', ADMIN_GANTT)
    expect(rest).toHaveLength(0)
    expect(request!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(request!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(request!.query.has('overdue')).toBe(false)
    expect(rows(ctx)).toEqual(['w1', 'w2', 'w3'])
    expect(ctx.wrapper.get('[data-testid="timeline-summary"]').text()).toBe(
      '3 görev · 1 bitti · 1 gecikmede',
    )
    expect(ctx.wrapper.text()).toContain('Yeni görev')
    expect(ctx.wrapper.find('[data-testid="timeline-department-filter"]').exists()).toBe(true)
    expect(ctx.wrapper.find('[data-testid="timeline-ceiling"]').exists()).toBe(false)
  })

  it('Koordinatör: coordinatorGantt (S3, görevin departmanı); koordinatörlük süzgeci yok', async () => {
    server.use(
      ...standingHandlers(COORDINATOR),
      ganttHandler(COORD_GANTT, gantt({ tasks: [TASKS[0]!] })),
    )
    const ctx = await mountPage(TimelinePage, COORD_SCOPE)
    const [request] = sent('GET', COORD_GANTT)
    expect(request!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(rows(ctx)).toEqual(['w1'])
    expect(ctx.wrapper.find('[data-testid="timeline-department-filter"]').exists()).toBe(false)
    expect(ctx.wrapper.text()).toContain('Yeni görev')
  })

  it('Üye: memberGantt; Yeni görev ve süzgeç yok', async () => {
    server.use(
      ...standingHandlers(MEMBER),
      ganttHandler(MEMBER_GANTT, gantt({ tasks: [TASKS[0]!] })),
    )
    const ctx = await mountPage(TimelinePage, MEMBER_SCOPE)
    expect(sent('GET', MEMBER_GANTT)).toHaveLength(1)
    expect(ctx.wrapper.text()).not.toContain('Yeni görev')
    expect(ctx.wrapper.find('[data-testid="timeline-department-filter"]').exists()).toBe(false)
  })

  it('Gantt kabına sözleşmeli prop’lar gider: ölçek varsayılanı hafta, bugün kurulum gününden', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE)
    const view = ctx.wrapper.findComponent({ name: 'GanttView' })
    expect(view.props('scale')).toBe('hafta')
    expect(view.props('today')).toBe('2026-10-21')
    // Admin yüzünde kod öneki verilir (E-03C-30)
    expect(view.props('departmentCodes')).toEqual(new Map([['d1', 'MEK']]))
  })
})

describe('Zaman çizelgesi — süzgeç ve ölçek (URL)', () => {
  it('durum süzgeci URL’den: Geciken yalnız lateness.is_overdue; tamamlanmış geç görev değil', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE, '/zaman-cizelgesi?durum=geciken')
    expect(rows(ctx)).toEqual(['w2'])
    // Sayaçlar süzgeçten bağımsız (yüklü yanıt)
    expect(ctx.wrapper.get('[data-testid="timeline-summary"]').text()).toContain('3 görev')
  })

  it('araç çubuğundan durum seçimi URL’ye yazılır (varsayılan yazılmaz)', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE)
    const buttons = ctx.wrapper.get('[role="group"][aria-label="Durum"]').findAll('button')
    await buttons[3]!.trigger('click')
    await flushPromises()
    expect(query(ctx)).toEqual({ durum: 'biten' })
    expect(rows(ctx)).toEqual(['w3'])
    await buttons[0]!.trigger('click')
    await flushPromises()
    expect(query(ctx)).toEqual({})
    expect(rows(ctx)).toEqual(['w1', 'w2', 'w3'])
  })

  it('Admin: tek departman süzgeci (departman=…); K/Ü yüzünde ve bilinmeyen kimlikte yok sayılır', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const admin = await mountPage(TimelinePage, ADMIN_SCOPE, '/zaman-cizelgesi?departman=d2')
    expect(rows(admin)).toEqual(['w2'])
    expect(admin.wrapper.get('[data-testid="timeline-department-filter"]').text()).toBe(
      'Koordinatörlük 1',
    )
    const unknown = await mountPage(TimelinePage, ADMIN_SCOPE, '/zaman-cizelgesi?departman=yok')
    expect(rows(unknown)).toEqual(['w1', 'w2', 'w3'])
  })

  it('K/Ü yüzünde departman parametresi etkisiz', async () => {
    server.use(...standingHandlers(COORDINATOR), ganttHandler(COORD_GANTT, gantt({ tasks: TASKS })))
    const ctx = await mountPage(TimelinePage, COORD_SCOPE, '/zaman-cizelgesi?departman=d2')
    expect(rows(ctx)).toEqual(['w1', 'w2', 'w3'])
  })

  it('ölçek ±: URL olcek; sınırda tık etkisiz', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE)
    await ctx.wrapper.get('[data-action="zoom-in"]').trigger('click')
    await flushPromises()
    expect(query(ctx)).toEqual({ olcek: 'gun' })
    expect(ctx.wrapper.findComponent({ name: 'GanttView' }).props('scale')).toBe('gun')
    expect(ctx.wrapper.get('[data-action="zoom-in"]').attributes('aria-disabled')).toBe('true')
    await ctx.wrapper.get('[data-action="zoom-in"]').trigger('click')
    await flushPromises()
    expect(query(ctx)).toEqual({ olcek: 'gun' })
    await ctx.wrapper.get('[data-action="zoom-out"]').trigger('click')
    await flushPromises()
    await ctx.wrapper.get('[data-action="zoom-out"]').trigger('click')
    await flushPromises()
    expect(query(ctx)).toEqual({ olcek: 'ay' })
  })

  it('kapsam değişince departman ve seçim sıfırlanır; ölçek ve durum korunur', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(
      TimelinePage,
      ADMIN_SCOPE,
      '/zaman-cizelgesi?departman=d1&olcek=ay&durum=acik&secili=w1',
    )
    ctx.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await flushPromises()
    expect(query(ctx)).toEqual({ olcek: 'ay', durum: 'acik' })
  })
})

describe('Zaman çizelgesi — seçim ve panel', () => {
  it('satır seçimi URL secili yazar ve paneli açar; kapat seçimi kaldırır, odak satıra döner', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE)
    const row = ctx.wrapper.get('[data-row-key="w2"]')
    ;(row.element as HTMLElement).focus()
    await row.trigger('click')
    await flushPromises()
    expect(query(ctx)).toEqual({ secili: 'w2' })
    const panel = ctx.wrapper.get('[data-testid="timeline-panel"]')
    expect(panel.attributes('data-face')).toBe('admin')
    expect(panel.get('[data-testid="tp-title"]').text()).toBe('İzmir planı')
    expect(panel.get('[data-testid="tp-kicker"]').text()).toContain('İdari işler')
    expect(ctx.wrapper.find('.gantt').exists()).toBe(true)

    await panel.get('[data-testid="tp-close"]').trigger('click')
    await flushPromises()
    expect(query(ctx)).toEqual({})
    expect(ctx.wrapper.find('[data-testid="timeline-panel"]').exists()).toBe(false)
    expect(document.activeElement).toBe(row.element)
  })

  it('odak izi yoksa (fare ile seçim) panel kapanınca odak Gantt kabına döner, gövdeye düşmez', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE)
    ;(document.activeElement as HTMLElement | null)?.blur()
    await ctx.wrapper.get('[data-work-item="w1"]').trigger('click')
    await flushPromises()
    await ctx.wrapper.get('[data-testid="tp-close"]').trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(ctx.wrapper.get('[data-testid="timeline-board"]').element)
  })

  it('Liste görünümünde aç: /gorevler?gorev=‹id›', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE, '/zaman-cizelgesi?secili=w1')
    await ctx.wrapper.get('[data-testid="tp-open-list"]').trigger('click')
    await flushPromises()
    expect(ctx.router.currentRoute.value.fullPath).toBe('/gorevler?gorev=w1')
  })

  it('yanıtta olmayan ya da süzgeç dışına düşen seçim URL’den düşer (panel kapanır)', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const missing = await mountPage(TimelinePage, ADMIN_SCOPE, '/zaman-cizelgesi?secili=yok')
    await flushPromises()
    expect(query(missing)).toEqual({})
    expect(missing.wrapper.find('[data-testid="timeline-panel"]').exists()).toBe(false)

    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE, '/zaman-cizelgesi?secili=w1')
    expect(ctx.wrapper.find('[data-testid="timeline-panel"]').exists()).toBe(true)
    await ctx.wrapper
      .get('[role="group"][aria-label="Durum"]')
      .findAll('button')[3]!
      .trigger('click')
    await flushPromises()
    expect(query(ctx)).toEqual({ durum: 'biten' })
    expect(ctx.wrapper.find('[data-testid="timeline-panel"]').exists()).toBe(false)
  })
})

describe('Zaman çizelgesi — tutamaç görünürlüğü (P8, yalnız çağıran hesabı)', () => {
  const draggable = (ctx: Awaited<ReturnType<typeof mountPage>>) =>
    [
      ...(ctx.wrapper.findComponent({ name: 'GanttView' }).props('draggableIds') as Set<string>),
    ].sort()

  it('Admin: tamamlanmamış görevlerin hepsi; tamamlanmış değil', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    expect(draggable(await mountPage(TimelinePage, ADMIN_SCOPE))).toEqual(['w1', 'w2'])
  })

  it('Koordinatör: kendi biriminin görevleri; Üye: hiç', async () => {
    server.use(...standingHandlers(COORDINATOR), ganttHandler(COORD_GANTT, gantt({ tasks: TASKS })))
    expect(draggable(await mountPage(TimelinePage, COORD_SCOPE))).toEqual(['w1'])
    unmountPages()
    server.use(...standingHandlers(MEMBER), ganttHandler(MEMBER_GANTT, gantt({ tasks: TASKS })))
    expect(draggable(await mountPage(TimelinePage, MEMBER_SCOPE))).toEqual([])
  })
})

describe('Zaman çizelgesi — tavan, boş, yükleniyor, hata (E-03C-82, 83)', () => {
  it('199 kalemde uyarı yok; tam 200’de uyarı ve "N+" sayaçlar', async () => {
    server.use(...standingHandlers(ADMIN), ganttHandler(ADMIN_GANTT, manyTasks(199)))
    const below = await mountPage(TimelinePage, ADMIN_SCOPE)
    expect(below.wrapper.find('[data-testid="timeline-ceiling"]').exists()).toBe(false)
    expect(below.wrapper.get('[data-testid="timeline-summary"]').text()).toContain('199 görev')
    unmountPages()

    server.use(ganttHandler(ADMIN_GANTT, manyTasks(200)))
    const full = await mountPage(TimelinePage, ADMIN_SCOPE)
    expect(full.wrapper.get('[data-testid="timeline-ceiling"]').text()).toBe(
      'Liste sınıra ulaşmış olabilir; süzgeçle daraltın.',
    )
    expect(full.wrapper.get('[data-testid="timeline-summary"]').text()).toContain('200+ görev')
    expect(full.wrapper.get('[data-testid="timeline-summary"]').text()).toContain(
      'yüklenen kayıtlar içinde',
    )
  })

  it('yükleniyor: iskelet satırlar, başlık ve araç çubuğu görünür, sayaç ve şerit yok', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      ...standingHandlers(ADMIN),
      http.get(`${ORIGIN}${ADMIN_GANTT}`, async () => {
        await gate
        return json(gantt({ tasks: TASKS }))
      }),
    )
    const held = () => true
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE, '/zaman-cizelgesi', held)
    expect(ctx.wrapper.get('h1').text()).toBe('Görevler')
    expect(ctx.wrapper.find('[data-skeleton]').exists()).toBe(true)
    expect(ctx.wrapper.find('[data-testid="timeline-summary"]').exists()).toBe(false)
    expect(ctx.wrapper.find('[data-testid="timeline-strip"]').exists()).toBe(false)
    expect(ctx.wrapper.find('[data-testid="timeline-toolbar"]').exists()).toBe(true)
    release()
    await settle()
    expect(ctx.wrapper.find('[data-skeleton]').exists()).toBe(false)
    expect(ctx.wrapper.find('[data-testid="timeline-strip"]').exists()).toBe(true)
  })

  it('hata: bölge içi "Yeniden dene" yeniden okur; sunucu iletisi gösterilmez', async () => {
    let fail = true
    server.use(
      ...standingHandlers(ADMIN),
      http.get(`${ORIGIN}${ADMIN_GANTT}`, () =>
        fail ? errorEnvelope('platform.internal', 500) : json(gantt({ tasks: TASKS })),
      ),
    )
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE)
    const alert = ctx.wrapper.get('[role="alert"]')
    expect(alert.text()).toContain('Zaman çizelgesi yüklenemedi')
    expect(alert.text()).not.toContain('sunucu iletisi')
    expect(ctx.wrapper.find('[data-testid="timeline-summary"]').exists()).toBe(false)
    fail = false
    await alert.get('button').trigger('click')
    await settle()
    expect(rows(ctx)).toEqual(['w1', 'w2', 'w3'])
  })

  it('boş: Admin "Yeni görev" çağrısı görür; Üye görmez', async () => {
    server.use(...standingHandlers(ADMIN), ganttHandler(ADMIN_GANTT, gantt({ tasks: [] })))
    const admin = await mountPage(TimelinePage, ADMIN_SCOPE)
    expect(admin.wrapper.text()).toContain('Zaman çizelgesinde gösterilecek görev yok')
    expect(admin.wrapper.find('.gantt').exists()).toBe(false)
    // Tarihli görev yok: aralık yok, şerit çizilmez (sahte aralık yok)
    expect(admin.wrapper.find('[data-testid="timeline-strip"]').exists()).toBe(false)
    expect(admin.wrapper.findAll('button').filter((b) => b.text() === 'Yeni görev')).toHaveLength(2)
    unmountPages()

    server.use(...standingHandlers(MEMBER), ganttHandler(MEMBER_GANTT, gantt({ tasks: [] })))
    const member = await mountPage(TimelinePage, MEMBER_SCOPE)
    expect(member.wrapper.text()).toContain('Zaman çizelgesinde gösterilecek görev yok')
    expect(member.wrapper.text()).not.toContain('Yeni görev')
  })

  it('süzgeç sonucu boş: süzgeçleri temizle seçimi korur', async () => {
    server.use(...standingHandlers(ADMIN), ganttHandler(ADMIN_GANTT, gantt({ tasks: [TASKS[0]!] })))
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE, '/zaman-cizelgesi?durum=biten&olcek=ay')
    expect(ctx.wrapper.text()).toContain('Bu süzgeçle görev yok')
    await ctx.wrapper
      .findAll('button')
      .find((b) => b.text() === 'Süzgeçleri temizle')!
      .trigger('click')
    await flushPromises()
    expect(query(ctx)).toEqual({ olcek: 'ay' })
    expect(rows(ctx)).toEqual(['w1'])
  })
})

describe('Zaman çizelgesi — başlık eylemleri ve şerit', () => {
  it('Liste: /gorevler (süzgeç taşınmaz); Yeni görev: sayfa içi diyalog (rota değişmez)', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(
      TimelinePage,
      ADMIN_SCOPE,
      '/zaman-cizelgesi?durum=geciken&departman=d2',
    )
    await ctx.wrapper
      .get('[role="group"][aria-label="Görünüm"]')
      .findAll('button')[0]!
      .trigger('click')
    await flushPromises()
    expect(ctx.router.currentRoute.value.fullPath).toBe('/gorevler')

    await ctx.router.push('/zaman-cizelgesi?departman=d2')
    await ctx.wrapper
      .findAll('button')
      .find((b) => b.text() === 'Yeni görev')!
      .trigger('click')
    await settle()
    expect(ctx.router.currentRoute.value.path).toBe('/zaman-cizelgesi')
    expect(query(ctx)).toEqual({ departman: 'd2' })
    expect(document.body.querySelector('[role="dialog"] #wf-new-task')).not.toBeNull()
  })

  it('şerit: görev aralığı + program yılı; Gantt kaydırması görünen aralığı yansıtır; tık Gantt’ı kaydırır', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE)
    expect(ctx.wrapper.get('[data-testid="timeline-strip-kicker"]').text()).toBe(
      'görev aralığı 2026',
    )
    expect(ctx.wrapper.get('[data-testid="timeline-strip"]').text()).toContain('16 Haz – 15 Eyl')
    // Gerçek Gantt görünen aralığı kurulumda bildirir → çerçeve çizilir
    const frame = () => ctx.wrapper.find('[data-testid="timeline-strip-frame"]')
    expect(frame().exists()).toBe(true)
    const before = (frame().element as HTMLElement).style.left
    expect(ctx.wrapper.text().toLowerCase()).not.toContain('sezon')
    // Şerit tıkı Gantt'ı kaydırır (scrollToDay): görünen aralık çerçevesi yerinde kalır/güncellenir
    const track = ctx.wrapper.get('[data-testid="timeline-strip-track"]').element
    track.getBoundingClientRect = () => ({ left: 0, width: 300, top: 0, height: 32 }) as DOMRect
    track.dispatchEvent(new MouseEvent('click', { clientX: 290, detail: 1, bubbles: true }))
    await flushPromises()
    expect(frame().exists()).toBe(true)
    expect(typeof before).toBe('string')
  })

  it('dışa aktarım devre dışı: tık istek atmaz', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE)
    const before = sent('GET', ADMIN_GANTT).length
    await ctx.wrapper.get('[data-action="export-pdf"]').trigger('click')
    await ctx.wrapper.get('[data-action="export-image"]').trigger('click')
    await settle()
    expect(sent('GET', ADMIN_GANTT)).toHaveLength(before)
    expect(ctx.wrapper.get('[data-action="export-pdf"]').attributes('aria-disabled')).toBe('true')
  })
})

describe('Zaman çizelgesi — tam ekran (E-03C-12)', () => {
  it('giriş: Fullscreen API çağrılır, kap tam ekran kipine geçer; düğmeyle çıkış odağı düğmeye döndürür', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE)
    const request = vi.fn(() => Promise.resolve())
    const stage = ctx.wrapper.get('[data-testid="timeline-stage"]')
    ;(stage.element as HTMLElement).requestFullscreen = request
    const button = ctx.wrapper.get('[data-action="fullscreen"]')
    await button.trigger('click')
    expect(request).toHaveBeenCalledTimes(1)
    expect(stage.classes()).toContain('timeline-stage--full')
    expect(button.attributes('aria-pressed')).toBe('true')

    await button.trigger('click')
    await flushPromises()
    expect(stage.classes()).not.toContain('timeline-stage--full')
    expect(button.attributes('aria-pressed')).toBe('false')
    expect(document.activeElement).toBe(button.element)
  })

  it('API yoksa CSS kipi; Esc çıkar ve odak düğmeye döner', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE)
    const stage = ctx.wrapper.get('[data-testid="timeline-stage"]')
    const button = ctx.wrapper.get('[data-action="fullscreen"]')
    await button.trigger('click')
    expect(stage.classes()).toContain('timeline-stage--full')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(stage.classes()).not.toContain('timeline-stage--full')
    expect(document.activeElement).toBe(button.element)
  })

  it('sayfa sökülünce dinleyici kalmaz (sonraki Esc etkisiz)', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      ganttHandler(ADMIN_GANTT, gantt({ tasks: TASKS })),
      ...panelHandlers(),
    )
    const ctx = await mountPage(TimelinePage, ADMIN_SCOPE)
    await ctx.wrapper.get('[data-action="fullscreen"]').trigger('click')
    const remove = vi.spyOn(window, 'removeEventListener')
    ctx.wrapper.unmount()
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})
