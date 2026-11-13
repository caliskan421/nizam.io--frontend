import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { useToast } from '@/shared/ui'

import { mountWith, unmountAll } from '../__tests__/mount'
import { seasonFixture } from '../__tests__/fixtures'
import {
  browserSave,
  errorEnvelope,
  http,
  json,
  ORIGIN,
  pdf,
  resetHarness,
  sent,
  server,
  standing,
  ticketOk,
} from '../__tests__/harness'
import { reportGate } from '../model/gate'
import { takeFocusReturn, SEASON_RETURN_KEY } from '../model/return-focus'
import SeasonReportPage from './SeasonReportPage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

let saved: ReturnType<typeof browserSave>
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  saved = browserSave()
  useToast().clear()
})
afterEach(() => {
  unmountAll()
  reportGate.reset()
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

const DEPARTMENTS = http.get(`${ORIGIN}/v1/program/departments`, () =>
  json({
    departments: [
      { department_id: 'd1', display_name: 'Altyapı ve tesisat', code: 'ALT' },
      { department_id: 'd2', display_name: 'Operasyon' },
    ],
  }),
)
const SEASON = (body = seasonFixture()) => http.get(`${ORIGIN}/v1/reports/season`, () => json(body))

async function open(...extra: Parameters<typeof server.use>) {
  server.use(...standing({ admin: true }), DEPARTMENTS, ...extra)
  const mounted = await mountWith(SeasonReportPage)
  await vi.waitFor(() =>
    expect(mounted.wrapper.find('[data-testid="season-stage"]').exists()).toBe(true),
  )
  await settleQueries(mounted.queryClient)
  return mounted
}

describe('SeasonReportPage (01f; E-13-13…40)', () => {
  it('okuma yalnız sayfa açılınca: S2 başlığı ve tek istek; başlık "Önizleme"', async () => {
    const { wrapper } = await open(SEASON())
    expect(wrapper.get('h1').text()).toBe('Dönem sonu raporu')
    expect(wrapper.get('.report-page__sub').text()).toBe('Önizleme')
    const calls = sent('GET', '/v1/reports/season')
    expect(calls).toHaveLength(1)
    expect(calls[0]?.headers.get('X-Nizamio-Program')).toBe('p1')
  })

  it('kâğıtlar sırayla: kapak, içindekiler, özet, Gantt, genel, koordinatörlükler, ek; sayfa numarası yok', async () => {
    const { wrapper } = await open(SEASON())
    const labels = wrapper.findAll('article.report-paper').map((a) => a.attributes('aria-label'))
    expect(labels).toEqual([
      'DÖNEM SONU RAPORU',
      'İÇİNDEKİLER',
      'YÖNETİCİ ÖZETİ',
      'GANTT — GÖREV ZAMAN ÇİZELGESİ',
      'TEKNOFEST GENELİ',
      'Altyapı ve tesisat',
      'Operasyon',
      'EK: SÖZLÜK VE KURALLAR',
    ])
    expect(wrapper.text()).not.toMatch(/Sayfa \d|\d+ sayfa|\d+ MB|TRT/)
    expect(
      wrapper.findAll('article.report-paper').every((a) => a.attributes('data-theme') === 'light'),
    ).toBe(true)
  })

  it('kapak: program adı büyük harf, oluşturulma kurulum saat diliminde, 8 KPI, gizli alanlar yok', async () => {
    const { wrapper } = await open(SEASON())
    const cover = wrapper.get('#report-season-cover')
    expect(cover.text()).toContain('ŞANLIURFA TEKNOFEST')
    expect(cover.text()).toContain('Oluşturulma: 21.10.2026 14:05')
    const kpis = cover.findAll('.report-kpi')
    expect(kpis).toHaveLength(8)
    expect(kpis[0]!.text()).toContain('GÖREV')
    expect(kpis[0]!.text()).toContain('3')
    expect(kpis[0]!.text()).toContain('1 tamamlandı')
    expect(kpis[1]!.text()).toContain('%33')
    expect(kpis[1]!.text()).toContain('1 geç tamamlandı')
    expect(kpis[2]!.text()).toContain('2 açık görevden')
    expect(kpis[3]!.text()).toContain('118 not')
    expect(cover.text()).not.toMatch(/çalışma grubu|MB|\d{2}\.\d{2}\.\d{4} –/)
  })

  it('özet: dağılımlar JSON anahtarlarından; karşılaştırma tablosu ada göre; DOSYA sütunu stub', async () => {
    const { wrapper } = await open(SEASON())
    const summary = wrapper.get('#report-season-summary')
    expect(summary.get('[data-status="tamamlandi"]').text()).toContain('1')
    expect(summary.get('[data-status="tamamlandi"]').text()).toContain('%33')
    expect(summary.findAll('[data-priority]')).toHaveLength(4)
    const rows = summary.findAll('[role="row"]').slice(1)
    expect(
      rows.map((r) => (r.find('strong').exists() ? r.get('strong').text() : r.text().slice(0, 6))),
    ).toEqual(['Altyapı ve tesisat', 'Operasyon', 'Toplam'])
    expect(summary.findAll('[data-design-stub="BE-136"]').length).toBeGreaterThanOrEqual(2)
    expect(summary.text()).toContain('2 bölüm')
  })

  it('statik yer tutucular sahte veri göstermez: Gantt (BE-123), iş yükü (BE-134), detay/toplantı/dosya (BE-136)', async () => {
    const { wrapper } = await open(SEASON())
    expect(wrapper.get('#report-season-gantt [data-design-stub="BE-123"]').text()).toBe(
      'Gantt önizlemesi bu sürümde yok.',
    )
    expect(wrapper.get('#report-season-general [data-design-stub="BE-134"]').text()).toBe(
      'İş yükü bölümü için veri ucu yok.',
    )
    const dept = wrapper.get('#report-season-dept-d1')
    expect(dept.findAll('[data-design-stub="BE-136"]')).toHaveLength(2)
    expect(dept.find('[data-design-stub="BE-123"]').exists()).toBe(true)
    expect(wrapper.find('.report-gantt').exists()).toBe(false)
  })

  it('genel: aylık aktivite yalnız gerçek seri (toplam 81), erişilebilir metin özeti; talepler 4 KPI', async () => {
    const { wrapper } = await open(SEASON())
    const general = wrapper.get('#report-season-general')
    expect(general.text()).toContain('Toplam 81 kayıt')
    const chart = general.get('[data-testid="activity-chart"]')
    expect(chart.attributes('aria-label')).toBe(
      'Aylık aktivite, Mayıs 2026 – Haziran 2026: en yüksek Haziran 2026 ile 61 kayıt, toplam 81 kayıt',
    )
    expect(chart.findAll('.report-chart__col')).toHaveLength(2)
    expect(general.text()).toContain('oluşturulan ve tamamlanan görev, toplantı ve mesaj')
    expect(general.text()).not.toContain('ortalama kayma')
    const requests = general.findAll('[aria-label="Tarih talepleri"] .report-kpi')
    expect(requests.map((k) => k.get('.report-kpi__value').text())).toEqual(['9', '5', '1', '3'])
    expect(requests[3]!.text()).toContain('%33 · karar bekliyor')
  })

  it('koordinatörlük bölümü: künye, 5 KPI, durum şeridi, görev tablosu (sıra created_at, gecikme metinleri), boş bölüm', async () => {
    const { wrapper } = await open(SEASON())
    const dept = wrapper.get('#report-season-dept-d1')
    expect(dept.text()).toContain('KOORDİNATÖRLÜK · ALT')
    expect(dept.text()).toContain('ALTYAPI VE TESİSAT')
    expect(dept.text()).toContain('Fuar alanı altyapısı')
    expect(dept.text()).toContain('Abdullah Ateş')
    expect(dept.findAll('.report-kpi')).toHaveLength(5)
    const rows = dept.findAll('[data-task]')
    expect(rows.map((r) => r.attributes('data-task'))).toEqual(['w1', 'w2', 'w3'])
    expect(rows[0]!.text()).toContain('acil')
    expect(rows[0]!.text()).toContain('4 gün gecikti')
    expect(rows[0]!.text()).toContain('plan 30.09')
    expect(rows[1]!.text()).toContain('2 gün geç bitti')
    expect(rows[1]!.text()).toContain('atanmamış')
    expect(dept.text()).not.toContain('#')
    const empty = wrapper.get('#report-season-dept-d2')
    expect(empty.text()).toContain('Bu koordinatörlükte görev yok.')
    expect(empty.text()).toContain('KOORDİNATÖRLÜK')
  })

  it('içindekiler: sayfa içi bağlantı bölüme kaydırır ve odağı bölüme taşır', async () => {
    const { wrapper } = await open(SEASON())
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    await wrapper.get('[data-toc="summary"]').trigger('click')
    expect(scroll).toHaveBeenCalled()
    expect(document.activeElement?.id).toBe('report-season-summary')
    await wrapper.get('[data-toc="department"] a').trigger('click')
    expect(document.activeElement?.id).toBe('report-season-dept-d1')
  })

  it('boş dönem (sıfır zarf) yine çizilir: boş metinler, PDF yine indirilebilir', async () => {
    const empty = seasonFixture({
      coordinatorship_performance: [],
      tasks: [],
      monthly_activity: [],
      task_status_distribution: {},
      priority_distribution: {},
      date_change_stats: { approved: 0, pending: 0, rejected: 0, total: 0 },
    })
    const { wrapper } = await open(SEASON(empty))
    expect(wrapper.text()).toContain('Koordinatörlük verisi bulunamadı.')
    expect(wrapper.text()).toContain('Aktivite verisi bulunamadı.')
    expect(wrapper.get('[data-testid="preview-pdf"] button').attributes('disabled')).toBeUndefined()
  })

  it('yakınlaştırma yalnız CSS ölçek (%50–%200, adım %25); istek yok', async () => {
    const { wrapper } = await open(SEASON())
    const stack = wrapper.get('.report-stack')
    await wrapper.get('[data-action="zoom-in"]').trigger('click')
    expect(wrapper.get('[data-testid="zoom-value"]').text()).toBe('%125')
    expect((stack.element as HTMLElement).style.zoom).toBe('1.25')
    for (let i = 0; i < 10; i++) await wrapper.get('[data-action="zoom-out"]').trigger('click')
    expect(wrapper.get('[data-testid="zoom-value"]').text()).toBe('%50')
    expect(wrapper.get('[data-action="zoom-out"]').attributes('disabled')).toBeDefined()
    expect(sent('GET', '/v1/reports/season')).toHaveLength(1)
  })

  it('"PDF indir" aynı düğme ve durum makinesi: tam rapor biletini üretir ve kaydeder', async () => {
    server.use(
      ticketOk(),
      pdf({ 'Content-Disposition': 'attachment; filename="donem-raporu-2026-11-13.pdf"' }),
    )
    const { wrapper, queryClient } = await open(SEASON())
    const button = wrapper.get('[data-testid="preview-pdf"] button')
    expect(button.text()).toBe('PDF indir')
    await button.trigger('click')
    await settleQueries(queryClient)
    await vi.waitFor(() => expect(saved.clicked).toEqual(['donem-raporu-2026-11-13.pdf']))
    expect(sent('POST', '/v1/download-tickets')[0]?.body).toMatchObject({
      path: '/v1/reports/season/pdf',
    })
  })

  it('"Kapat" Arşiv\'e gider ve odak dönüşünü ister', async () => {
    const { wrapper, router } = await open(SEASON())
    const close = wrapper.get('[data-action="close"]')
    expect(close.attributes('href')).toBe('/arsiv')
    await close.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('archive.folders')
    expect(takeFocusReturn(SEASON_RETURN_KEY)).toBe(true)
  })

  it('yükleniyor: kâğıt iskeleti + "Rapor hazırlanıyor…" (istek açıkken sahte değer yok)', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      ...standing({ admin: true }),
      DEPARTMENTS,
      http.get(`${ORIGIN}/v1/reports/season`, async () => {
        await gate
        return json(seasonFixture())
      }),
    )
    const { wrapper } = await mountWith(SeasonReportPage)
    await vi.waitFor(() => expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true))
    expect(wrapper.text()).toContain('Rapor hazırlanıyor…')
    expect(wrapper.find('.report-skeleton').exists()).toBe(true)
    expect(wrapper.find('article[aria-label="YÖNETİCİ ÖZETİ"]').exists()).toBe(false)
    release()
    await vi.waitFor(() => expect(wrapper.find('[data-testid="season-stage"]').exists()).toBe(true))
  })

  it('hata: bölge içi metin (sunucu iletisi yok) + "Yeniden dene" tekrar okur; otomatik tekrar yok', async () => {
    let calls = 0
    server.use(
      ...standing({ admin: true }),
      DEPARTMENTS,
      http.get(`${ORIGIN}/v1/reports/season`, () => {
        calls += 1
        return calls === 1 ? errorEnvelope('reporting.capacity_full', 503) : json(seasonFixture())
      }),
    )
    const { wrapper } = await mountWith(SeasonReportPage)
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Rapor kapasitesi dolu; biraz sonra yeniden deneyin.',
    )
    expect(wrapper.text()).not.toContain('sunucu iletisi')
    expect(calls).toBe(1)
    await wrapper.get('[role="alert"] button').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[data-testid="season-stage"]').exists()).toBe(true))
    expect(calls).toBe(2)
  })

  it('sayfa sözleşmesi gövdeden bağımsız: prop/emit yok', () => {
    expect(Object.keys(SeasonReportPage.props ?? {})).toEqual([])
    expect(SeasonReportPage.emits ?? []).toEqual([])
  })
})
