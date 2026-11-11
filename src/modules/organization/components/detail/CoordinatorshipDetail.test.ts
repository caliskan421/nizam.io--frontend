import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { pageCrumb } from '@/shared/navigation/page-crumb'
import { ICONS } from '@/shared/ui'

import { requests, resetHarness, sent, server } from '../../__tests__/harness'
import {
  ADMIN,
  mountWith,
  serverHandlers,
  settle,
  stat,
  unmountAll,
  workItem,
} from './__tests__/detail-harness'
import CoordinatorshipDetail from './CoordinatorshipDetail.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

const mountDetail = (props: Record<string, unknown> = {}) =>
  mountWith(CoordinatorshipDetail, { departmentId: 'd1', ...props })

const dataPaths = () =>
  requests
    .map((r) => r.path)
    .filter((p) => !['/v1/me', '/v1/me/departments', '/v1/programs'].includes(p))

describe('08b veri kaynağı (K3; tek birim, fan-out yok)', () => {
  it('ŞY: tek departman okuması (readProgramDepartment) + tek rapor + yalnız bu birimin ekibi ve görevleri', async () => {
    server.use(...serverHandlers())
    await mountDetail()
    expect(sent('GET', '/v1/program/departments/d1')).toHaveLength(1)
    expect(sent('GET', '/v1/program/departments')).toHaveLength(0)
    expect(sent('GET', '/v1/reports/dashboard')).toHaveLength(1)
    expect(sent('GET', '/v1/departments/d1/members')).toHaveLength(1)
    expect(sent('GET', '/v1/departments/d2/members')).toHaveLength(0)
    const work = sent('GET', '/v1/program/work-items')
    expect(work).toHaveLength(1)
    expect(work[0]!.query.get('department_id')).toBe('d1')
    for (const r of requests) {
      expect(r.headers.get('X-Nizamio-Department'), r.path).toBeNull()
    }
  })

  it('görev listesi imleç bitene dek aynı uçla sayfalanır (fan-out değil)', async () => {
    server.use(...serverHandlers({ items: [workItem()], nextCursor: 'c2', next: [workItem()] }))
    await mountDetail()
    const work = sent('GET', '/v1/program/work-items')
    expect(work.map((r) => r.query.get('cursor'))).toEqual([null, 'c2'])
    expect(work.every((r) => r.query.get('department_id') === 'd1')).toBe(true)
  })
})

describe('E-08-52 derin bağlantı / seçili programda yok', () => {
  it('açıklama readProgramDepartment alanından (BE-049); derin bağlantı liste yüklemeden açılır', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountDetail()
    expect(wrapper.get('[data-testid="cd-description"]').text()).toBe(
      'Temiz su ve atıksu altyapısını kurar.',
    )
  })

  it('listede olan birim: başlık, kod rozeti, "‹N› kişi" (etkin satırlar)', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountDetail()
    expect(wrapper.get('[data-testid="cd-title"]').text()).toBe('Altyapı ve tesisat')
    expect(wrapper.get('[data-testid="cd-badge"]').text()).toBe('ALT')
    expect(wrapper.get('[data-testid="cd-sub"]').text()).toBe('3 kişi')
  })

  it('E-08-50: kırıntı son parçası birim adı; sökülünce katalog başlığına döner', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountDetail()
    expect(pageCrumb.value).toBe('Altyapı ve tesisat')
    wrapper.unmount()
    expect(pageCrumb.value).toBeNull()
  })

  it('kodsuz birimde rozet ad baş harfleri (İ büyük harf, tr)', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountDetail({ departmentId: 'd2' })
    expect(wrapper.get('[data-testid="cd-badge"]').text()).toBe('İİ')
  })

  it('404 program.department_not_found → ileti + 08 bağlantısı; ekip/görev isteği yok', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountDetail({ departmentId: 'd9' })
    expect(wrapper.get('[data-state="missing"]').text()).toContain(
      'Bu koordinatörlük seçili programda yok',
    )
    expect(wrapper.get('[data-action="back"]').attributes('href')).toBe('/koordinatorlukler')
    expect(dataPaths().sort()).toEqual(['/v1/program/departments/d9', '/v1/reports/dashboard'])
    expect(pageCrumb.value).toBeNull()
  })

  it('kapsam değişince birim yeni programda yoksa aynı ileti (ayrıntı boşalır)', async () => {
    server.use(...serverHandlers())
    const { wrapper, h } = await mountDetail()
    expect(wrapper.find('[data-testid="cd-title"]').exists()).toBe(true)
    server.use(...serverHandlers({ departments: [{ department_id: 'd7', display_name: 'Başka' }] }))
    h.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await settle()
    expect(wrapper.find('[data-testid="cd-title"]').exists()).toBe(false)
    expect(wrapper.find('[data-state="missing"]').exists()).toBe(true)
  })

  it('departman okunamazsa (403) bölge içi hata + Yeniden dene', async () => {
    server.use(...serverHandlers())
    const { http, json, ORIGIN } = await import('../../__tests__/harness')
    server.use(
      http.get(`${ORIGIN}/v1/program/departments/:id`, () =>
        json({ code: 'program.not_authorized', message: 'x', request_id: 'r', fields: [] }, 403),
      ),
    )
    const { wrapper } = await mountDetail()
    expect(wrapper.find('[data-state="error"]').exists()).toBe(true)
  })
})

describe('E-08-54…56 başlık eylemleri', () => {
  it('Ekibe mesaj F7 devre dışı (aria-disabled + faz notu); Görev ata birim ön seçili', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountDetail()
    const message = wrapper.get('[data-action="message"]')
    expect(message.attributes('aria-disabled')).toBe('true')
    expect(message.text()).toContain('F7’de')
    const assign = wrapper.get('[data-action="assign"]')
    expect(assign.attributes('href')).toBe('/gorevler?koordinatorluk=d1&yeni=1')
  })

  it('Diğer işlemler: Düzenle formu açar; Birleştir/Pasifleştir devre dışı BE-017', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountDetail()
    await wrapper.get('[data-action="more"]').trigger('click')
    expect(wrapper.get('[data-action="merge"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-action="deactivate"]').attributes('disabled')).toBeDefined()
    expect(
      wrapper
        .get('[data-action="merge"]')
        .element.closest('[data-design-stub]')!
        .getAttribute('data-design-stub'),
    ).toBe('BE-017')
    expect(wrapper.get('[data-form="department"]').attributes('data-open')).toBe('false')
    await wrapper.get('[data-action="edit"]').trigger('click')
    expect(wrapper.get('[data-form="department"]').attributes('data-open')).toBe('true')
    expect(wrapper.get('[data-form="department"]').attributes('data-dept')).toBe('d1')
  })

  it('kapsam değişince açık form kapanır', async () => {
    server.use(...serverHandlers())
    const { wrapper, h } = await mountDetail()
    await wrapper.get('[data-action="about-edit"]').trigger('click')
    expect(wrapper.get('[data-form="department"]').attributes('data-open')).toBe('true')
    h.store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    server.use(...serverHandlers({ departments: [{ department_id: 'd1', display_name: 'X' }] }))
    h.store.commit({ programId: 'p3', lens: 'admin', departmentId: null })
    await settle()
    expect(wrapper.find('[data-form="department"][data-open="true"]').exists()).toBe(false)
  })
})

describe('E-08-57 sekme şeridi', () => {
  it('tablist/tabpanel + aria-controls; Arşiv ve Toplantılar aria-disabled, sayısız', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountDetail()
    const tablist = wrapper.get('[role="tablist"]')
    const panel = wrapper.get('[role="tabpanel"]')
    const tabs = tablist.findAll('[role="tab"]')
    expect(tabs.map((t) => t.attributes('data-value'))).toEqual([
      'genel',
      'uyeler',
      'gorevler',
      'arsiv',
      'toplantilar',
      'ayarlar',
    ])
    const genel = tabs[0]!
    expect(genel.attributes('aria-selected')).toBe('true')
    expect(genel.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(panel.attributes('aria-labelledby')).toBe(genel.attributes('id'))
    expect(tabs[1]!.text()).toBe('Üyeler 3')
    expect(tabs[2]!.text()).toBe('Görevler 12')
    for (const [i, phase] of [
      [3, 'F5’te'],
      [4, 'F4’te'],
    ] as const) {
      expect(tabs[i]!.attributes('aria-disabled')).toBe('true')
      expect(tabs[i]!.text()).toContain(phase)
      expect(tabs[i]!.find('.rp-count').exists()).toBe(false)
    }
  })

  it('tık ve ←/→ ile seçilir (update:tab); faz dışı sekme seçilmez', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountDetail()
    const tabs = () => wrapper.findAll('[role="tab"]')
    await tabs()[3]!.trigger('click')
    expect(wrapper.emitted('update:tab')).toBeUndefined()
    await tabs()[1]!.trigger('click')
    ;(tabs()[0]!.element as HTMLElement).focus()
    await wrapper.get('[role="tablist"]').trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('update:tab')).toEqual([['uyeler'], ['ayarlar']])
  })

  it('prop tab=uyeler Üyeler panelini, tab=gorevler özet + 03 bağlantısını çizer', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountDetail({ tab: 'gorevler' })
    expect(wrapper.get('[role="tabpanel"]').attributes('data-panel')).toBe('gorevler')
    expect(wrapper.get('[data-task-stat="open"]').text()).toBe('5')
    expect(wrapper.get('[data-action="open-tasks"]').attributes('href')).toBe(
      '/gorevler?koordinatorluk=d1',
    )
    await wrapper.setProps({ tab: 'uyeler' })
    expect(wrapper.find('[data-card="members"]').exists()).toBe(true)
  })

  it('Ayarlar: ad/kod/açıklama + Düzenle formu açar', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountDetail({ tab: 'ayarlar' })
    expect(wrapper.get('[data-setting="code"]').text()).toBe('ALT')
    await wrapper.get('[data-action="settings-edit"]').trigger('click')
    expect(wrapper.get('[data-form="department"]').attributes('data-open')).toBe('true')
  })
})

describe('E-08-64…69 KPI şeridi', () => {
  it('5 hücre: açık (Türkçe ek), geciken + en uzun, tamamlanma ölçeği, tarih talebi, arşiv', async () => {
    server.use(
      ...serverHandlers({
        items: [
          workItem({ is_overdue: true, days_overdue: 41 }),
          workItem({ is_overdue: true, days_overdue: 98 }),
          workItem({
            title: 'Hidrofor sistemi kurulumu',
            pending_date_request: {
              request_id: 'r1',
              new_start_on: '2026-09-10',
              new_end_on: '2026-10-31',
            },
          }),
        ],
      }),
    )
    const { wrapper } = await mountDetail()
    const cells = wrapper.findAll('[data-kpi]')
    expect(cells).toHaveLength(5)
    const cell = (k: string) => wrapper.get(`[data-kpi="${k}"]`)
    expect(cell('open').get('[data-kpi-value]').text()).toBe('5')
    expect(cell('open').get('[data-kpi-note]').text()).toBe('12 görevin 7’si bitti')
    expect(cell('overdue').get('[data-kpi-value]').text()).toBe('3')
    expect(cell('overdue').get('[data-kpi-note]').text()).toBe('En uzunu 98 gün')
    expect(cell('completion').get('[data-kpi-value]').text()).toBe('%58')
    expect(cell('completion').get('[data-kpi-note]').text()).toBe('Sezon ortalaması %41')
    expect(cell('dateRequest').get('[data-kpi-value]').text()).toBe('1')
    expect(cell('dateRequest').get('[data-kpi-note]').text()).toBe('Hidrofor sistemi kurulumu')
    expect(cell('archive').attributes('aria-disabled')).toBe('true')
    expect(cell('archive').get('[data-kpi-value]').text()).toBe('—')
    expect(cell('archive').get('[data-kpi-note]').text()).toBe('F5’te')
  })

  it('görev sayfaları sürerken liste kaynaklı notlar "yüklenen kayıtlar içinde"', async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => (release = resolve))
    const { http, json, ORIGIN } = await import('../../__tests__/harness')
    server.use(...serverHandlers())
    server.use(
      http.get(`${ORIGIN}/v1/program/work-items`, async ({ request }) => {
        if (new URL(request.url).searchParams.get('cursor')) {
          await gate
          return json({ items: [] })
        }
        return json({ items: [workItem({ is_overdue: true, days_overdue: 9 })], next_cursor: 'c2' })
      }),
    )
    const { wrapper } = await mountDetail()
    expect(wrapper.get('[data-kpi="overdue"] [data-kpi-note]').text()).toBe(
      'En uzunu 9 gün · yüklenen kayıtlar içinde',
    )
    release()
    await settle()
    expect(wrapper.get('[data-kpi="overdue"] [data-kpi-note]').text()).toBe('En uzunu 9 gün')
  })
})

describe('E-08-70…77 Hakkında', () => {
  it('açıklama canlı; Kuruluş/Görünürlük "—" BE-018; arşiv F5; üst birim ve alt birimler yok', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountDetail()
    expect(wrapper.get('[data-testid="cd-description"]').text()).toBe(
      'Temiz su ve atıksu altyapısını kurar.',
    )
    for (const field of ['founded', 'visibility']) {
      const el = wrapper.get(`[data-field="${field}"]`)
      expect(el.attributes('data-design-stub')).toBe('BE-018')
      expect(el.text()).toBe('—')
    }
    const archive = wrapper.get('[data-field="archive"]')
    expect(archive.attributes('aria-disabled')).toBe('true')
    expect(archive.text()).toBe('F5’te')
    expect(wrapper.get('[data-action="about-edit"] path').attributes('d')).toBe(ICONS.edit)
    expect(wrapper.text()).not.toContain('Üst birim')
    expect(wrapper.text()).not.toContain('Alt birim')
  })

  it('açıklaması olmayan birimde paragraf çizilmez', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountDetail({ departmentId: 'd2' })
    expect(wrapper.find('[data-testid="cd-description"]').exists()).toBe(false)
  })
})

describe('E-08-82…90 yan sütun', () => {
  it('Dikkat: geciken, days_overdue azalan, ilk 3; kısa kod ALT; tarih talebi eki; Tümü', async () => {
    server.use(
      ...serverHandlers({
        items: [
          workItem({ title: 'A', is_overdue: true, days_overdue: 21 }),
          workItem({
            title: 'B',
            is_overdue: true,
            days_overdue: 98,
            assignees: [{ account_id: 'a2', full_name: 'Ali Avcı' }],
            assignee_account_ids: ['a2'],
          }),
          workItem({ title: 'C', is_overdue: true, days_overdue: 5 }),
          workItem({
            title: 'D',
            is_overdue: true,
            days_overdue: 41,
            pending_date_request: {
              request_id: 'r',
              new_start_on: '2026-09-10',
              new_end_on: '2026-10-31',
            },
          }),
          workItem({ title: 'E' }),
        ],
      }),
    )
    const { wrapper } = await mountDetail()
    const rows = wrapper.findAll('[data-attention]')
    expect(rows.map((r) => r.find('a').text())).toEqual(['B', 'D', 'A'])
    expect(rows[0]!.text()).toContain('ALT · Ali Avcı')
    expect(rows[0]!.text()).toContain('98 gün gecikti')
    expect(rows[1]!.text()).toContain('tarih talebi var')
    expect(wrapper.get('[data-action="attention-all"]').attributes('href')).toBe(
      '/gorevler?koordinatorluk=d1&durum=geciken',
    )
  })

  it('Kısayollar: Görevlerde aç + Zaman çizelgesinde gör canlı; F5/F4 devre dışı; PDF yok; Son etkinlik stub', async () => {
    server.use(...serverHandlers())
    const { wrapper } = await mountDetail()
    expect(wrapper.get('[data-shortcut="tasks"]').attributes('href')).toBe(
      '/gorevler?koordinatorluk=d1',
    )
    // E-08-86 (F3): admin yüzü tek departman süzgeciyle zaman çizelgesine
    expect(wrapper.get('[data-shortcut="timeline"]').attributes('href')).toBe(
      '/zaman-cizelgesi?departman=d1',
    )
    expect(wrapper.get('[data-shortcut="timeline"]').attributes('aria-disabled')).toBeUndefined()
    for (const [key, phase] of [
      ['archive', 'F5’te'],
      ['meeting', 'F4’te'],
    ]) {
      const el = wrapper.get(`[data-shortcut="${key}"]`)
      expect(el.attributes('aria-disabled')).toBe('true')
      expect(el.attributes('href')).toBeUndefined()
      expect(el.text()).toContain(phase)
    }
    expect(wrapper.text()).not.toContain('PDF')
    const feed = wrapper.get('[data-testid="cd-activity"]')
    expect(feed.attributes('data-design-stub')).toBe('BE-018')
    expect(feed.findAll('li')).toHaveLength(0)
  })
})

describe('E-08-78…81 Ekip', () => {
  it('"Ekip ‹N›" etkin satırlar; koordinatör önce, ad sırası; açık iş; ad → 05b', async () => {
    server.use(
      ...serverHandlers({
        items: [
          workItem({ assignee_account_ids: ['a1'] }),
          workItem({ assignee_account_ids: ['a1'], status: 'tamamlandi' }),
          workItem({ assignee_account_ids: ['a1', 'a2'] }),
        ],
      }),
    )
    const { wrapper } = await mountDetail()
    expect(wrapper.get('[data-testid="cd-team-count"]').text()).toBe('3')
    const tiles = wrapper.findAll('[data-tile]')
    expect(tiles.map((t) => t.find('a').text())).toEqual([
      'Ali Avcı',
      'Çağrı Demir',
      'Zeynep Arslan',
    ])
    expect(tiles[0]!.find('[data-lead]').text()).toBe('Koordinatör')
    expect(tiles[1]!.find('[data-lead]').exists()).toBe(false)
    expect(tiles[0]!.get('[data-open]').text()).toBe('1 açık iş')
    expect(tiles[2]!.get('[data-open]').text()).toBe('2 açık iş')
    expect(tiles[0]!.find('a').attributes('href')).toBe('/kullanicilar/a2')
  })

  it('ilk 6 kutucuk; Tüm üyeler Üyeler sekmesine; Üye ekle formu açar', async () => {
    const { rosterMember } = await import('../../__tests__/harness')
    const roster = Array.from({ length: 8 }, (_, i) => rosterMember(`m${i}`, `Kişi ${i}`, 'uye'))
    server.use(...serverHandlers({ roster }))
    const { wrapper } = await mountDetail()
    expect(wrapper.findAll('[data-tile]')).toHaveLength(6)
    await wrapper.get('[data-action="team-all"]').trigger('click')
    expect(wrapper.emitted('update:tab')).toEqual([['uyeler']])
    await wrapper.get('[data-action="team-add"]').trigger('click')
    expect(wrapper.get('[data-form="member"]').attributes('data-open')).toBe('true')
    expect(wrapper.get('[data-form="member"]').attributes('data-dept')).toBe('d1')
  })
})

describe('yetki (ADMIN olgusu; mercek yetki değil)', () => {
  it('Koordinatör merceğindeki yönetici de aynı eylemleri görür', async () => {
    server.use(
      ...serverHandlers({
        standing: { ...ADMIN, rows: [{ department_id: 'd2', role: 'koordinator' }] },
      }),
    )
    const { wrapper } = await mountWith(
      CoordinatorshipDetail,
      { departmentId: 'd1' },
      '/koordinatorlukler/d1',
      { programId: 'p1', lens: 'coordinator', departmentId: 'd2' },
    )
    expect(wrapper.find('[data-action="more"]').exists()).toBe(true)
    expect(wrapper.find('[data-action="team-add"]').exists()).toBe(true)
    expect(sent('GET', '/v1/reports/dashboard')).toHaveLength(1)
  })

  it('stat yoksa (rapor satırı yok) sayılar "—"', async () => {
    server.use(...serverHandlers({ stats: [stat('d2')] }))
    const { wrapper } = await mountDetail()
    expect(wrapper.get('[data-kpi="open"] [data-kpi-value]').text()).toBe('—')
    expect(wrapper.get('[data-kpi="completion"] [data-kpi-value]').text()).toBe('—')
  })
})
