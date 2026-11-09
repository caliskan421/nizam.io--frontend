import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'

import {
  errorEnvelope,
  http,
  json,
  ORIGIN,
  requests,
  resetHarness,
  sent,
  server,
} from '../__tests__/harness'
import { daysAgo, NOW, stat } from '../components/coordinatorships/__tests__/fixtures'
import {
  ADMIN,
  dashboard,
  mountWith,
  settle,
  standingHandlers,
  type StandingFixture,
  stubComponent,
  unmountAll,
} from '../components/coordinatorships/__tests__/mount'
import type { CoordinatorshipStat } from '../model/types'
import CoordinatorshipsPage from './CoordinatorshipsPage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => {
  vi.useRealTimers()
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

const DEPARTMENTS_PATH = '/v1/program/departments'
const DASHBOARD_PATH = '/v1/reports/dashboard'

const DEPARTMENTS = [
  { department_id: 'd1', display_name: 'Mekanik sistemler', code: 'MEK' },
  { department_id: 'd2', display_name: 'İdari işler' },
  { department_id: 'd3', display_name: 'Fuar', code: 'FUA' },
]

/** Süzmesiz rapor: programda bağlı olmayan bir birimin satırı da gelir (istemci yok saymalı). */
const STATS: CoordinatorshipStat[] = [
  stat('d1', { description: 'Saha işleri', last_activity_at: daysAgo(2) }),
  stat('d2', { coordinators: [], member_count: 0, last_activity_at: daysAgo(40) }),
  stat('d3', { total_tasks: 0, last_activity_at: null }),
  stat('d-baska', { coordinators: [] }),
]

// Komşu bileşenler (W74) sözleşme adlarıyla taslaklanır (TASLAK; O4 entegrasyon turu girdisi).
const DepartmentFormStub = stubComponent(
  'DepartmentForm',
  ['open', 'departmentId'],
  ['update:open', 'saved'],
  (p) => h('div', { 'data-form': p.open ? 'open' : 'closed' }),
)
const CoordinatorAssignDialogStub = stubComponent(
  'CoordinatorAssignDialog',
  ['open', 'departmentId'],
  ['update:open', 'assigned'],
  (p) => h('div', { 'data-assign': p.departmentId, 'data-open': String(p.open) }),
)
const STUBS = {
  DepartmentForm: DepartmentFormStub,
  CoordinatorAssignDialog: CoordinatorAssignDialogStub,
}

function handlers(
  options: {
    fixture?: StandingFixture
    departments?: unknown[]
    stats?: CoordinatorshipStat[]
    truncated?: boolean
  } = {},
) {
  return [
    ...standingHandlers(options.fixture ?? ADMIN),
    http.get(`${ORIGIN}${DEPARTMENTS_PATH}`, () =>
      json(
        { departments: options.departments ?? DEPARTMENTS },
        200,
        options.truncated ? { 'X-Result-Truncated': 'true' } : {},
      ),
    ),
    http.get(`${ORIGIN}${DASHBOARD_PATH}`, () => json(dashboard(options.stats ?? STATS, 17))),
  ]
}

async function page(path = '/koordinatorlukler') {
  return mountWith(CoordinatorshipsPage, { path, stubs: STUBS })
}

const cardIds = (w: Awaited<ReturnType<typeof page>>['wrapper']) =>
  w.findAll('article.rp-ccard').map((c) => c.attributes('data-department'))

describe('veri kaynağı (backend.md ana karar, K3)', () => {
  it('ŞY: tek listProgramDepartments + tek reportDashboard; birim başına istek yok', async () => {
    server.use(...handlers())
    const { wrapper } = await page()
    expect(sent('GET', DEPARTMENTS_PATH)).toHaveLength(1)
    expect(sent('GET', DASHBOARD_PATH)).toHaveLength(1)
    expect(requests.filter((r) => /\/v1\/departments\//.test(r.path))).toEqual([])
    expect(requests.filter((r) => r.path === '/v1/program/work-items')).toEqual([])
    expect(sent('GET', DASHBOARD_PATH)[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    // Programda bağlı olmayan rapor satırı kart olmaz; sıra Türkçe ada göre.
    expect(cardIds(wrapper)).toEqual(['d3', 'd2', 'd1'])
  })

  it('alt satır, sayım satırı ve yapı sağlığı aynı kümeden', async () => {
    server.use(...handlers())
    const { wrapper } = await page()
    expect(wrapper.get('[data-testid="coords-sub"]').text()).toBe(
      '3 koordinatörlük · 17 kişi · 2026 sezonu',
    )
    expect(wrapper.get('[data-testid="coords-count"]').text()).toBe(
      '3 / 3 koordinatörlük gösteriliyor',
    )
    const n = (key: string) => wrapper.get(`[data-health="${key}"] [data-testid="health-n"]`).text()
    expect([n('no-lead'), n('no-members'), n('no-tasks'), n('quiet')]).toEqual(['1', '1', '1', '2'])
    expect(wrapper.get('[data-health="no-tasks"] [data-testid="health-note"]').text()).toBe('Fuar')
  })

  it('kesilmiş departman listesi → "sınıra ulaşmış olabilir"; yıl yoksa sezon parçası yok', async () => {
    server.use(...handlers({ truncated: true, fixture: { ...ADMIN, year: null } }))
    const { wrapper } = await page()
    expect(wrapper.get('[data-testid="coords-sub"]').text()).toBe(
      '3 koordinatörlük (sınıra ulaşmış olabilir) · 17 kişi',
    )
  })
})

describe('gizli öğeler (E-08-14/15/17…26/31/40…43)', () => {
  it('toplu seçim çubuğu, seçim kutuları, grup başlıkları, durum/üst birim süzgeci yok', async () => {
    server.use(...handlers())
    const { wrapper } = await page()
    expect(wrapper.find('[aria-label="Seçili koordinatörlükler"]').exists()).toBe(false)
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Koordinatörlük yapısı"]').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/seçili|Tümünü seç|Buraya ekle|Aktif|Pasif \d|Üst birim\b/)
  })
})

describe('arama ve sıralama (E-08-13, E-08-16, E-08-45)', () => {
  it('URL q süzer, sayım satırı süzgeç sonrası; sirala=ad:azalan ters sıra', async () => {
    server.use(...handlers())
    const { wrapper } = await page('/koordinatorlukler?q=%C4%B0DAR%C4%B0&sirala=ad:azalan')
    expect(cardIds(wrapper)).toEqual(['d2'])
    expect(wrapper.get('[data-testid="coords-count"]').text()).toBe(
      '1 / 3 koordinatörlük gösteriliyor',
    )
    expect((wrapper.get('input[type="search"]').element as HTMLInputElement).value).toBe('İDARİ')
  })

  it('koordinatör adıyla arama; azalan sıra', async () => {
    server.use(...handlers())
    const { wrapper } = await page('/koordinatorlukler?sirala=ad:azalan')
    expect(cardIds(wrapper)).toEqual(['d1', 'd2', 'd3'])
    unmountAll()
    server.use(...handlers())
    const second = await page('/koordinatorlukler?q=deniz')
    expect(cardIds(second.wrapper)).toEqual(['d3', 'd1'])
  })
})

describe('boş durumlar (E-08-39)', () => {
  it('süzgeç sonucu boş → rp-empty + "Süzgeçleri temizle" (q silinir)', async () => {
    server.use(...handlers())
    const { wrapper, router } = await page('/koordinatorlukler?q=yok-boyle&sirala=ad:azalan')
    const empty = wrapper.get('[data-testid="coords-filtered-empty"]')
    expect(empty.text()).toContain('Bu filtrelerle eşleşen koordinatörlük yok.')
    expect(wrapper.find('.rp-toolbar').exists()).toBe(true)
    await empty.get('button').trigger('click')
    await settle()
    expect(router.currentRoute.value.query).toEqual({ sirala: 'ad:azalan' })
    expect(cardIds(wrapper)).toHaveLength(3)
  })

  it('programda hiç birim yok → "programa departman katılmamış" + Yeni koordinatörlük', async () => {
    server.use(...handlers({ departments: [], stats: [] }))
    const { wrapper } = await page()
    const none = wrapper.get('[data-testid="coords-none"]')
    expect(none.text()).toContain('Programa departman katılmamış')
    expect(wrapper.find('.coords-health').exists()).toBe(false)
    expect(wrapper.find('[data-testid="coords-count"]').exists()).toBe(false)
    await none.get('button').trigger('click')
    await settle()
    expect(wrapper.get('[data-form]').attributes('data-form')).toBe('open')
  })
})

describe('yükleniyor / hata', () => {
  it('departman listesi hatası → bölge içi "Yeniden dene" tekrar okur', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      // Geçici olmayan hata (5xx okuma tekrarına girer, retryTransient).
      http.get(`${ORIGIN}${DEPARTMENTS_PATH}`, () => errorEnvelope('program.not_authorized', 403)),
      http.get(`${ORIGIN}${DASHBOARD_PATH}`, () => json(dashboard(STATS))),
    )
    const { wrapper } = await page()
    const retry = wrapper.findAll('button').find((b) => /Yeniden dene/.test(b.text()))!
    expect(wrapper.text()).toContain('Koordinatörlükler yüklenemedi')
    server.use(http.get(`${ORIGIN}${DEPARTMENTS_PATH}`, () => json({ departments: DEPARTMENTS })))
    await retry.trigger('click')
    await settle()
    expect(cardIds(wrapper)).toHaveLength(3)
  })

  it('rapor hatası → şeritte "Yeniden dene", kartlar sayısız ("—")', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      http.get(`${ORIGIN}${DEPARTMENTS_PATH}`, () => json({ departments: DEPARTMENTS })),
      http.get(`${ORIGIN}${DASHBOARD_PATH}`, () => errorEnvelope('reporting.not_authorized', 403)),
    )
    const { wrapper } = await page()
    expect(wrapper.text()).toContain('Yapı sağlığı yüklenemedi')
    expect(wrapper.findAll('[data-testid="members"]').map((m) => m.text())).toEqual(['—', '—', '—'])
    expect(wrapper.get('[data-testid="coords-sub"]').text()).toBe('3 koordinatörlük · 2026 sezonu')
  })
})

describe('eylemler (E-08-05, E-08-33, E-08-38)', () => {
  it('"Yeni koordinatörlük" → DepartmentForm açılır', async () => {
    server.use(...handlers())
    const { wrapper } = await page()
    expect(wrapper.get('[data-form]').attributes('data-form')).toBe('closed')
    await wrapper
      .findAll('.rp-actions button')
      .find((b) => b.text() === 'Yeni koordinatörlük')!
      .trigger('click')
    expect(wrapper.get('[data-form]').attributes('data-form')).toBe('open')
  })

  it('"Koordinatör ata" → diyalog birimle açılır; atama sonrası rapor yeniden okunur', async () => {
    server.use(...handlers())
    const { wrapper } = await page()
    await wrapper.get('[data-department="d2"] .coords-assign').trigger('click')
    const dialog = wrapper.getComponent(CoordinatorAssignDialogStub)
    expect(dialog.props('departmentId')).toBe('d2')
    dialog.vm.$emit('assigned', 'acc-9')
    await settle()
    expect(sent('GET', DASHBOARD_PATH)).toHaveLength(2)
    dialog.vm.$emit('update:open', false)
    await settle()
    expect(wrapper.find('[data-assign]').exists()).toBe(false)
  })

  it('kart "Görev ata" → 03 yeni görev girişi, departman ön seçili', async () => {
    server.use(...handlers())
    const { wrapper, router } = await page()
    await wrapper.get('[data-department="d1"] .coords-menu__btn').trigger('click')
    await wrapper
      .findAll('[data-department="d1"] [role="menuitem"]')
      .find((i) => i.text() === 'Görev ata')!
      .trigger('click')
    await settle()
    expect(router.currentRoute.value.name).toBe('work.tasks')
    expect(router.currentRoute.value.query).toEqual({ yeni: '1', koordinatorluk: 'd1' })
  })
})

describe('kapsam değişimi (satır dışı varsayım)', () => {
  it('program değişince açık diyalog kapanır, arama korunur, sıralama varsayılana döner', async () => {
    server.use(...handlers())
    const { wrapper, router, store } = await page('/koordinatorlukler?q=mek&sirala=ad:azalan')
    await wrapper.get('.rp-actions .t-btn--primary').trigger('click')
    expect(wrapper.get('[data-form]').attributes('data-form')).toBe('open')
    store.setProgram('p2')
    await settle()
    expect(wrapper.get('[data-form]').attributes('data-form')).toBe('closed')
    expect(router.currentRoute.value.query).toEqual({ q: 'mek' })
    expect(sent('GET', DEPARTMENTS_PATH).at(-1)!.headers.get('X-Nizamio-Program')).toBe('p2')
  })
})
