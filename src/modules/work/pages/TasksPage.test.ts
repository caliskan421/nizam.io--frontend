import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  errorEnvelope,
  http,
  ORIGIN,
  resetHarness,
  server,
  workItem,
} from '../model/__tests__/harness'
import type { WorkItem } from '../model/types'
import {
  ADMIN,
  LIST,
  listHandler,
  listRequests,
  mountPage,
  settle,
  standingHandlers,
  type StandingFixture,
  unmountPages,
} from './tasks/__tests__/page-harness'
import TasksPage from './TasksPage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
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

const pending = { request_id: 'r1', new_start_on: '2026-11-01', new_end_on: '2026-11-20' }
const item = (over: Partial<WorkItem>) => workItem(over) as WorkItem
const ROWS = [
  item({ work_item_id: 'w1', title: 'Asfalt', department_id: 'd1', status: 'devam_ediyor' }),
  item({
    work_item_id: 'w2',
    title: 'İzmir planı',
    department_id: 'd2',
    status: 'iade_edildi',
    is_overdue: true,
    days_overdue: 4,
    pending_date_request: pending,
  }),
  item({ work_item_id: 'w3', title: 'Bütçe', department_id: 'd1', status: 'tamamlandi' }),
]
const MEMBER_SCOPE = { programId: 'p1', lens: 'member' as const, departmentId: 'd1' }

const titles = (ctx: Awaited<ReturnType<typeof mountPage>>) =>
  ctx.wrapper.findAll('.rp-tr--body a.rp-title').map((a) => a.text())

describe('Görevler › Liste — kapsam ve görünürlük', () => {
  it('Admin: TEK liste isteği (department_id yok, S2); yönetici eylemleri', async () => {
    server.use(...standingHandlers(ADMIN), listHandler(ROWS))
    const ctx = await mountPage(TasksPage, ADMIN_SCOPE)
    const [request, ...rest] = listRequests()
    expect(rest).toHaveLength(0)
    expect(request!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(request!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(request!.query.has('department_id')).toBe(false)
    expect(titles(ctx)).toEqual(['Asfalt', 'İzmir planı', 'Bütçe'])
    const text = ctx.wrapper.text()
    expect(ctx.wrapper.get('[data-testid="tasks-summary"]').text()).toBe(
      '3 görev · 2 koordinatörlük · 1 kişi',
    )
    expect(text).toContain('Yeni görev')
    expect(ctx.wrapper.find('[data-testid="department-filter"]').exists()).toBe(true)
    expect(ctx.wrapper.find('[aria-label="Tarih talebi filtresi"]').exists()).toBe(true)
    const band = ctx.wrapper.get('[role="region"]')
    expect(band.text()).toContain('1 tarih değişikliği talebi onay bekliyor · İdari işler')
    expect(band.get('[data-testid="request-review"]').attributes('disabled')).toBeUndefined()
  })

  it('Admin koordinatörlük süzgeci: tek değer sunucuya, istek sayısı = 1 (K3, fan-out yok)', async () => {
    server.use(...standingHandlers(ADMIN), listHandler(ROWS))
    const ctx = await mountPage(TasksPage, ADMIN_SCOPE)
    await ctx.wrapper.get('[data-testid="department-filter"]').trigger('click')
    const options = ctx.wrapper.findAll('[role="menuitemradio"]')
    await options.find((o) => o.text() === 'İdari işler')!.trigger('click')
    await settle()
    expect(ctx.router.currentRoute.value.query).toEqual({ koordinatorluk: 'd2' })
    const requests = listRequests()
    expect(requests).toHaveLength(2)
    expect(requests[1]!.query.get('department_id')).toBe('d2')
    expect(requests[1]!.headers.get('X-Nizamio-Department')).toBeNull()
  })

  it('Koordinatör: seçili birim department_id; koordinatörlük süzgeci gizli, URL değeri etkisiz', async () => {
    server.use(...standingHandlers(COORDINATOR), listHandler(ROWS))
    const ctx = await mountPage(TasksPage, COORD_SCOPE, '/gorevler?koordinatorluk=d2')
    expect(listRequests()).toHaveLength(1)
    expect(listRequests()[0]!.query.get('department_id')).toBe('d1')
    expect(ctx.wrapper.find('[data-testid="department-filter"]').exists()).toBe(false)
    expect(ctx.wrapper.find('[aria-label="Tarih talebi filtresi"]').exists()).toBe(true)
    // Talepleri incele yalnız yöneticide (s.152).
    expect(ctx.wrapper.get('[role="region"]').find('[data-testid="request-review"]').exists()).toBe(
      false,
    )
    expect(ctx.wrapper.get('[data-new-task]').attributes('data-dept')).toBe('d1')
    expect(ctx.wrapper.text()).toContain('1 koordinatörlük')
  })

  it('Üye: talep süzgeci ve band gizli (veri gelse de), Yeni görev yok', async () => {
    server.use(...standingHandlers(MEMBER), listHandler(ROWS))
    const ctx = await mountPage(TasksPage, MEMBER_SCOPE, '/gorevler?talep=1')
    expect(ctx.wrapper.find('[aria-label="Tarih talebi filtresi"]').exists()).toBe(false)
    expect(ctx.wrapper.find('[role="region"]').exists()).toBe(false)
    expect(ctx.wrapper.text()).not.toContain('Yeni görev')
    expect(ctx.wrapper.find('[data-new-task]').exists()).toBe(false)
    // URL'deki talep süzgeci etkisiz: üç satır da görünür.
    expect(titles(ctx)).toHaveLength(3)
  })

  it('band talep yokken gizli (E-03-13)', async () => {
    server.use(...standingHandlers(ADMIN), listHandler([ROWS[0]!]))
    const ctx = await mountPage(TasksPage, ADMIN_SCOPE)
    expect(ctx.wrapper.find('[role="region"]').exists()).toBe(false)
  })
})

describe('Görevler › Liste — süzme, arama, sıralama (istemci)', () => {
  it('sekme + talep VE; Geri gönderildi kendi sekmesinde', async () => {
    server.use(...standingHandlers(ADMIN), listHandler(ROWS))
    const ctx = await mountPage(TasksPage, ADMIN_SCOPE, '/gorevler?durum=iade_edildi&talep=1')
    expect(titles(ctx)).toEqual(['İzmir planı'])
    const tabs = ctx.wrapper.get('[aria-label="Kayıtlı görünümler"]').findAll('button')
    expect(tabs.map((t) => t.text())).toContain('Geri gönderildi (1)')
    await tabs.find((t) => t.text().startsWith('Tamamlanan'))!.trigger('click')
    await settle()
    expect(ctx.router.currentRoute.value.query).toEqual({ durum: 'tamamlandi', talep: '1' })
    expect(titles(ctx)).toEqual([])
    expect(ctx.wrapper.text()).toContain('Süzgeçlerle eşleşen görev yok')
    expect(listRequests()).toHaveLength(1)
  })

  it('arama URL q ile, Türkçe katlama; boş sonuç → süzgeçleri temizle', async () => {
    server.use(...standingHandlers(ADMIN), listHandler(ROWS))
    const ctx = await mountPage(TasksPage, ADMIN_SCOPE, '/gorevler?q=izmir&sirala=gorev:artan')
    expect(titles(ctx)).toEqual(['İzmir planı'])
    await ctx.router.replace('/gorevler?q=yok&durum=geciken&sirala=gorev:artan')
    await settle()
    const clear = ctx.wrapper.findAll('button').find((b) => b.text() === 'Süzgeçleri temizle')!
    await clear.trigger('click')
    await settle()
    expect(ctx.router.currentRoute.value.query).toEqual({ sirala: 'gorev:artan' })
    expect(titles(ctx)).toEqual(['Asfalt', 'Bütçe', 'İzmir planı'])
  })

  it('sıralama başlığı döngüsü URL sirala (artan → azalan → sunucu sırası)', async () => {
    server.use(...standingHandlers(ADMIN), listHandler(ROWS))
    const ctx = await mountPage(TasksPage, ADMIN_SCOPE)
    const sortBy = async () => {
      await ctx.wrapper.get('[data-sort="gorev"]').trigger('click')
      await settle()
    }
    await sortBy()
    expect(ctx.router.currentRoute.value.query).toEqual({ sirala: 'gorev:artan' })
    await sortBy()
    expect(titles(ctx)).toEqual(['İzmir planı', 'Bütçe', 'Asfalt'])
    await sortBy()
    expect(ctx.router.currentRoute.value.query).toEqual({})
    expect(titles(ctx)).toEqual(['Asfalt', 'İzmir planı', 'Bütçe'])
  })
})

describe('Görevler › Liste — sayfalama ve durumlar', () => {
  it('next_cursor dolu: "yüklenen kayıtlar içinde" etiketleri; Daha fazla yükle → aynı uç + imleç', async () => {
    server.use(...standingHandlers(ADMIN), listHandler([ROWS[0]!], 'c1', [ROWS[1]!]))
    const ctx = await mountPage(TasksPage, ADMIN_SCOPE)
    expect(ctx.wrapper.get('[data-testid="tasks-summary"]').text()).toContain(
      '1+ görev · 2 koordinatörlük · 1 kişi · yüklenen kayıtlar içinde',
    )
    expect(ctx.wrapper.find('[data-testid="tabs-partial"]').exists()).toBe(true)
    await ctx.wrapper.get('[data-testid="load-more"]').trigger('click')
    await settle()
    const requests = listRequests()
    expect(requests).toHaveLength(2)
    expect(requests[1]!.query.get('cursor')).toBe('c1')
    expect(titles(ctx)).toEqual(['Asfalt', 'İzmir planı'])
    expect(ctx.wrapper.find('[data-testid="load-more"]').exists()).toBe(false)
    expect(ctx.wrapper.find('[data-testid="tabs-partial"]').exists()).toBe(false)
    expect(ctx.wrapper.get('[data-testid="pager-caption"]').text()).toBe('2 görev')
    expect(ctx.router.currentRoute.value.query).toEqual({})
  })

  it('liste boş: boş durum + (yetkiliyse) Yeni görev', async () => {
    server.use(...standingHandlers(COORDINATOR), listHandler([]))
    const ctx = await mountPage(TasksPage, COORD_SCOPE)
    expect(ctx.wrapper.text()).toContain('Bu kapsamda görev yok')
    const create = ctx.wrapper.get('.rp-empty').findAll('button')
    expect(create.map((b) => b.text())).toEqual(['Yeni görev'])
    await create[0]!.trigger('click')
    expect(ctx.wrapper.get('[data-new-task]').attributes('data-new-task')).toBe('open')
  })

  it('hata: kod metni + yeniden dene (sunucu iletisi gösterilmez)', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      http.get(`${ORIGIN}${LIST}`, () => errorEnvelope('work.input_invalid', 422)),
    )
    const ctx = await mountPage(TasksPage, ADMIN_SCOPE)
    const alert = ctx.wrapper.get('[role="alert"]')
    expect(alert.text()).toContain('Görevler yüklenemedi')
    expect(alert.text()).not.toContain('sunucu iletisi')
    server.use(listHandler(ROWS))
    await alert.get('button').trigger('click')
    await settle()
    expect(titles(ctx)).toHaveLength(3)
  })
})
