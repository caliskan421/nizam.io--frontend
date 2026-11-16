import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  makeSeasonLimits,
  makeTaskPriorityDistribution,
  makeTaskStatusDistribution,
  withDateChangeDefaults,
} from '@/shared/api/__tests__/defaults'
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
    expect(wrapper.text()).not.toMatch(/Sayfa \d|\d+ sayfa|TRT/)
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
    expect(cover.text()).not.toMatch(/çalışma grubu/)
  })

  it('özet: dağılımlar JSON anahtarlarından; karşılaştırma tablosu ada göre; DOSYA sütunu koordinatörlük dosya sayısı', async () => {
    const { wrapper } = await open(SEASON())
    const summary = wrapper.get('#report-season-summary')
    expect(summary.get('[data-status="tamamlandi"]').text()).toContain('1')
    expect(summary.get('[data-status="tamamlandi"]').text()).toContain('%33')
    expect(summary.findAll('[data-priority]')).toHaveLength(4)
    const rows = summary.findAll('[role="row"]').slice(1)
    expect(
      rows.map((r) => (r.find('strong').exists() ? r.get('strong').text() : r.text().slice(0, 6))),
    ).toEqual(['Altyapı ve tesisat', 'Operasyon', 'Toplam'])
    expect(summary.find('[data-design-stub]').exists()).toBe(false)
    expect(rows[0]!.findAll('[role="cell"]')[5]!.text()).toBe('2')
    expect(summary.text()).toContain('gündem 162/201')
    expect(summary.text()).toContain('412,6 MB')
    expect(summary.text()).toContain('2 bölüm')
  })

  it('yer tutucu kalmadı: Gantt, iş yükü, detay, toplantı, dosya canlı (BE-123/134/136)', async () => {
    const { wrapper } = await open(SEASON())
    expect(wrapper.find('[data-design-stub]').exists()).toBe(false)
    expect(wrapper.find('[data-placeholder]').exists()).toBe(false)
  })

  it('kapak: dönem aralığı görevlerden türetilmiş (dipnotla); yıl program_year; kullanıcı/dosya alt notları', async () => {
    const { wrapper } = await open(SEASON())
    const cover = wrapper.get('#report-season-cover')
    expect(cover.text()).toContain('01.09.2026 – 17.10.2026')
    expect(cover.get('[data-testid="cover-period-note"]').text()).toContain('görevlerin en erken')
    expect(cover.text()).toContain('ŞANLIURFA TEKNOFEST · 2026')
    expect(cover.text()).toContain('15 koordinatör')
    expect(cover.text()).toContain('412,6 MB')
    unmountAll()
    const none = await open(SEASON(seasonFixture({ period: null })))
    expect(none.wrapper.find('[data-testid="cover-period-note"]').exists()).toBe(false)
    expect(none.wrapper.get('#report-season-cover').text()).not.toContain('01.09.2026')
  })

  it('içindekiler: her koordinatörlük için Görevler · Görev detayları · Toplantılar · Dosyalar bağlantıları', async () => {
    const { wrapper } = await open(SEASON())
    const parts = wrapper
      .get('[data-toc="department"]')
      .findAll('[data-toc-part]')
      .map((a) => [a.attributes('data-toc-part'), a.attributes('href')])
    expect(parts).toEqual([
      ['tasks', '#report-season-dept-d1'],
      ['details', '#report-season-dept-d1-details'],
      ['meetings', '#report-season-dept-d1-meetings'],
      ['files', '#report-season-dept-d1-files'],
    ])
    expect(wrapper.find('#report-season-dept-d1-files').exists()).toBe(true)
  })

  it('genel: ortalama kayma, en çok talep alan görevler, aktivite dönem toplamları (not/dosya/talep)', async () => {
    const { wrapper } = await open(SEASON())
    const general = wrapper.get('#report-season-general')
    expect(general.text()).toContain('Onaylananlarda ortalama kayma: 4,2 gün')
    expect(general.get('[data-testid="top-requested"]').text()).toContain('ALT-7')
    expect(general.get('[data-testid="top-requested"]').text()).toContain('2 talep')
    expect(general.get('[data-testid="activity-extras"]').text()).toContain(
      '9 not · 3 dosya · 1 tarih talebi',
    )
    unmountAll()
    const plain = await open(
      SEASON(
        seasonFixture({
          date_change_stats: withDateChangeDefaults({
            approved: 0,
            pending: 0,
            rejected: 0,
            total: 0,
          }),
        }),
      ),
    )
    expect(plain.wrapper.text()).not.toContain('ortalama kayma')
    expect(plain.wrapper.find('[data-testid="top-requested"]').exists()).toBe(false)
  })

  it('görev detay kartı: açıklama, bağımlılık, not, tarih talebi (durum), dosyalar; bayrak/paylaşılan yok', async () => {
    const { wrapper } = await open(SEASON())
    const cards = wrapper.findAll('[data-testid="dept-details"] [data-detail]')
    expect(cards.map((c) => c.attributes('data-detail'))).toEqual(['w1'])
    const card = cards[0]!
    expect(card.text()).toContain('ALT-7')
    expect(card.text()).toContain('Ana panolardan stant adalarına kanal kazısı.')
    expect(card.get('[data-testid="detail-deps"]').text()).toContain('ALT-3')
    expect(card.get('[data-testid="detail-note"]').text()).toContain('Not 01 · 09.10.2026 11:20')
    expect(card.get('[data-testid="detail-note"]').text()).toContain('Bahar Kılıç')
    expect(card.text()).toContain('NOTLAR (2)')
    expect(card.text()).toContain('En yeni 1 not gösteriliyor.')
    const request = card.get('[data-testid="detail-request"]')
    expect(request.text()).toContain('17.10.2026')
    expect(request.text()).toContain('24.10.2026')
    expect(request.text()).toContain('Onay bekliyor')
    expect(request.text()).toContain('Gerekçe: taşeron gecikmesi')
    expect(card.text()).toContain('DOSYALAR (2)')
    expect(card.text()).toContain('plan-v3.pdf')
    expect(card.text()).toContain('Planlar · 3,0 MB · Bahar Kılıç')
    expect(card.text()).not.toMatch(/ENGEL|PAYLAŞILAN|SORU/)
    const empty = wrapper.get('#report-season-dept-d2 [data-testid="dept-details"]')
    expect(empty.text()).toContain('Ayrıntısı olan görev yok.')
  })

  it('toplantı kartı: sunucu sayaçları, ortak toplantıda diğer bölümler (silinmiş işaretli); olmayan bölümde boş metin', async () => {
    const { wrapper } = await open(SEASON())
    const card = wrapper.get('#report-season-dept-d1 [data-meeting="m1"]')
    expect(card.text()).toContain('14.10.2026 · 14:00')
    expect(card.text()).toContain('GÜNDEM 4/6')
    expect(card.text()).toContain('Haftalık koordinasyon')
    expect(card.text()).toContain('Katılımcı: 5')
    expect(card.text()).toContain('1 göreve dönüştürüldü')
    expect(card.text()).toContain('Ortak toplantı — diğer bölümler: Operasyon (silinmiş)')
    // d2 de bu toplantıya dahil.
    expect(wrapper.find('#report-season-dept-d2 [data-meeting="m1"]').exists()).toBe(true)
  })

  it('dosya tablosu: etikete göre gruplu (etiketsiz sonda), görev kodu + başlık, boyut MB; koordinatörlük toplamı başlıkta', async () => {
    const { wrapper } = await open(SEASON())
    const section = wrapper.get('#report-season-dept-d1 [data-testid="dept-files"]')
    expect(section.text()).toContain('2 dosya · 4,0 MB')
    const body = wrapper.get('#report-season-dept-d1 [data-testid="dept-files"]')
    expect(body.findAll('[data-testid="file-group"]').map((g) => g.text())).toEqual([
      'Planlar1 dosya · 3,0 MB',
      'Etiketsiz1 dosya · 1,0 MB',
    ])
    const rows = body.findAll('[data-testid="file-row"]')
    expect(rows[0]!.text()).toContain('plan-v3.pdf')
    expect(rows[0]!.text()).toContain('ALT-7')
    expect(rows[0]!.text()).toContain('12.10.2026')
    expect(rows[1]!.text()).toContain('IMG_1042.jpg')
    expect(wrapper.get('#report-season-dept-d2 [data-testid="dept-files"]').text()).toContain(
      'Bu koordinatörlükte dosya yok.',
    )
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
    const requests = general.findAll('[aria-label="Tarih talepleri"] .report-kpi')
    expect(requests.map((k) => k.get('.report-kpi__value').text())).toEqual(['9', '5', '1', '3'])
    expect(requests[3]!.text()).toContain('%33 · karar bekliyor')
  })

  it('koordinatörlük bölümü: künye, 6 KPI, durum şeridi, görev tablosu (sıra created_at, gecikme metinleri), boş bölüm', async () => {
    const { wrapper } = await open(SEASON())
    const dept = wrapper.get('#report-season-dept-d1')
    expect(dept.text()).toContain('KOORDİNATÖRLÜK · ALT')
    expect(dept.text()).toContain('ALTYAPI VE TESİSAT')
    expect(dept.text()).toContain('Fuar alanı altyapısı')
    expect(dept.text()).toContain('Abdullah Ateş')
    expect(dept.findAll('.report-kpi')).toHaveLength(6)
    expect(dept.text()).toContain('Bahar Kılıç, Kadir Özbek')
    const rows = dept.findAll('[data-task]')
    expect(rows.map((r) => r.attributes('data-task'))).toEqual(['w1', 'w2', 'w3'])
    expect(rows[0]!.text()).toContain('acil')
    expect(rows[0]!.text()).toContain('4 gün gecikti')
    expect(rows[0]!.text()).toContain('plan 30.09')
    expect(rows[1]!.text()).toContain('2 gün geç bitti')
    expect(rows[1]!.text()).toContain('atanmamış')
    expect(rows[0]!.text()).toContain('ALT-7')
    expect(rows[0]!.text()).toContain('2/2')
    expect(rows[1]!.text()).toContain('—')
    const empty = wrapper.get('#report-season-dept-d2')
    expect(empty.text()).toContain('Bu koordinatörlükte görev yok.')
    expect(empty.text()).toContain('KOORDİNATÖRLÜK')
  })

  it('Gantt (BE-123): bölüm grupları, görev satırı başına çubuk; geç biten kuyruk, açık gecikmiş kesik kenar; ok yok', async () => {
    const { wrapper } = await open(SEASON())
    const gantt = wrapper.get('[data-testid="gantt"]')
    expect(gantt.attributes('aria-label')).toBe(
      'Görev zaman çizelgesi, 3 görev, Eylül 2026 – Ekim 2026',
    )
    expect(gantt.findAll('[data-gantt-task]').map((r) => r.attributes('data-gantt-task'))).toEqual([
      'w1',
      'w2',
      'w3',
    ])
    expect(wrapper.get('#report-season-gantt').text()).toContain('Altyapı ve tesisat  ·  3 görev')
    expect(wrapper.get('#report-season-gantt').text()).toContain('Operasyon  ·  0 görev')
    const cells = gantt.findAll('.report-gantt__cell:not(.report-gantt__cell--group)')
    expect(cells).toHaveLength(3)
    // w1: açık gecikmiş (kesik kenar); w2: geç bitti ama tamamlanma günü yok → tek çubuk.
    expect(cells[0]!.find('.report-gantt__bar--overdue').exists()).toBe(true)
    expect(cells.every((c) => c.find('.report-gantt__bar').exists())).toBe(true)
    expect(gantt.find('.report-gantt__today').exists()).toBe(true)
    expect(wrapper.text()).toContain('Rapor tarihi 21.10.2026')
    expect(wrapper.text()).toContain('Bağımlılık okları')
  })

  it('Gantt boş dönem: çubuk uydurulmaz, tek satır metin', async () => {
    const { wrapper } = await open(
      SEASON(seasonFixture({ tasks: [], coordinatorship_performance: [] })),
    )
    expect(wrapper.find('[data-testid="gantt"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="gantt-empty"]').text()).toBe(
      'Çizelgede gösterilecek görev yok.',
    )
  })

  it('iş yükü (BE-134): workload_summary satırları sunucu sırasıyla, sayaçlar ve dağılım çubuğu; stub yok', async () => {
    const { wrapper } = await open(SEASON())
    const rows = wrapper.findAll('[data-testid="workload-row"]')
    expect(
      rows.map((r) =>
        r
          .findAll('[role="cell"]')
          .map((c) => c.text())
          .slice(0, 5),
      ),
    ).toEqual([
      ['Bahar Kılıç', '4', '1', '6', '10'],
      ['Kadir Özbek', '2', '0', '3', '5'],
    ])
    expect(wrapper.text()).toContain('2 kişi (aktif göreve göre)')
    const bars = rows[0]!.findAll('.report-track > span').map((b) => b.attributes('style'))
    expect(bars).toEqual(['width: 60%;', 'width: 30%;', 'width: 10%;'])
    expect(rows[1]!.get('[title]').attributes('title')).toBe(
      '3 tamamlanan · 2 aktif (zamanında) · 0 geciken',
    )
    expect(wrapper.find('[data-design-stub="BE-134"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('veri ucu yok')
  })

  it('iş yükü boş dönem: tek satır metin, tablo yok', async () => {
    const { wrapper } = await open(SEASON(seasonFixture({ workload_summary: [] })))
    expect(wrapper.find('[data-testid="workload-row"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="workload"]').text()).toContain('İş yükü verisi bulunamadı.')
  })

  it('kesme (BE-132): limits kesildiğini söylerse "gösterilen N / toplam M" uyarısı; kesme yoksa hiçbir şey çizilmez', async () => {
    const { wrapper } = await open(SEASON())
    expect(wrapper.find('[data-testid="season-truncated"]').exists()).toBe(false)
    unmountAll()
    const cut = seasonFixture({
      limits: makeSeasonLimits({
        tasks_total: 5200,
        tasks_returned: 5000,
        files_total: 2000,
        files_returned: 2000,
      }),
    })
    const again = await open(SEASON(cut))
    const note = again.wrapper.get('[data-testid="season-truncated"]')
    expect(note.attributes('role')).toBe('status')
    expect(note.text()).toContain('görev 5000 / 5200 gösteriliyor.')
    expect(note.text()).not.toContain('dosya')
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
      task_status_distribution: makeTaskStatusDistribution(),
      priority_distribution: makeTaskPriorityDistribution(),
      date_change_stats: withDateChangeDefaults({ approved: 0, pending: 0, rejected: 0, total: 0 }),
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
