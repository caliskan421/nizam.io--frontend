import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { pageCrumb } from '@/shared/navigation/page-crumb'

import { requests, resetHarness } from '../../__tests__/harness'
import { usePersonWorkItems } from '../../api'
import {
  listHandler,
  listRequests,
  mountAt,
  server,
  settle,
  standingHandlers,
  unmountAll,
  usersHandler,
  USERS,
  workItem,
} from './__tests__/tracking-harness'
import PersonalTracking from './PersonalTracking.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  // 2026-11-11 çarşamba, Europe/Istanbul.
  vi.setSystemTime(new Date('2026-11-11T09:00:00Z'))
})
afterEach(() => {
  unmountAll()
  resetHarness()
  vi.useRealTimers()
})
afterAll(() => server.close())

const U1: [string, string] = ['u1', 'Bahar Kılıç']
const OTHER: [string, string] = ['u9', 'Başka Kişi']

const ITEMS = [
  workItem('w1', [U1], {
    status: 'devam_ediyor',
    end_on: '2026-11-04',
    is_overdue: true,
    days_overdue: 7,
  }),
  workItem('w2', [U1, OTHER], { status: 'onaya_sunuldu', end_on: '2026-11-13' }),
  workItem('w3', [OTHER], { status: 'baslanmadi' }),
  workItem('w4', [U1], { status: 'tamamlandi', end_on: '2026-11-02' }),
  workItem('w5', [U1], { status: 'iade_edildi', end_on: '2026-11-25', department_id: 'd2' }),
]

function setup(extra: Parameters<typeof server.use> = []) {
  server.use(
    ...standingHandlers(),
    listHandler(ITEMS),
    usersHandler([{ account_id: 'u1', full_name: 'Bahar Kılıç', memberships: ['p1:d1:uye'] }]),
    ...extra,
  )
}

describe('05b veri kaynağı (KESİN 21, K3, §10)', () => {
  it('tek uç, department_id yok, sonuna dek sayfalama; departman fan-out ve dosya okuması yok', async () => {
    let release!: () => void
    server.use(
      ...standingHandlers(),
      listHandler(
        [ITEMS[0]!, ITEMS[2]!],
        [ITEMS[1]!, ITEMS[3]!, ITEMS[4]!],
        new Promise<void>((resolve) => (release = resolve)),
      ),
      usersHandler([]),
    )
    const { wrapper } = await mountAt(PersonalTracking, { accountId: 'u1' })

    // Sayfa sürerken yaklaşık etiket; sayılar yüklenen küme içinden.
    expect(wrapper.find('[data-partial]').text()).toContain('yüklenen kayıtlar içinde')
    expect(wrapper.find('[data-card="acik"] [data-card-value]').text()).toBe('1')

    release()
    await settle()
    expect(wrapper.find('[data-partial]').exists()).toBe(false)
    expect(wrapper.find('[data-card="acik"] [data-card-value]').text()).toBe('3')

    const reqs = listRequests()
    expect(reqs).toHaveLength(2)
    for (const req of reqs) {
      expect(req.query.get('department_id')).toBeNull()
      expect(req.headers.get('X-Nizamio-Program')).toBe('p1')
      expect(req.headers.get('X-Nizamio-Department')).toBeNull()
    }
    expect(reqs[1]!.query.get('cursor')).toBe('c1')
    const paths = requests.map((r) => r.path)
    expect(paths.filter((p) => /\/departments\/[^/]+\/members/.test(p))).toEqual([])
    expect(paths.filter((p) => /\/work-items\/[^/]+\/files/.test(p))).toEqual([])
  })

  it('05 panel özetiyle aynı sorgu anahtarı: ikinci tüketici yeni istek atmaz', async () => {
    setup()
    const { wrapper, queryClient } = await mountAt(PersonalTracking, { accountId: 'u1' })
    expect(wrapper.find('[data-card="acik"] [data-card-value]').text()).toBe('3')
    const before = listRequests().length

    // 05 yan paneli (W75) aynı composable'ı kullanır: aynı önbellek, ek istek yok.
    const { defineComponent, createApp } = await import('vue')
    const { VueQueryPlugin } = await import('@tanstack/vue-query')
    const { getActivePinia } = await import('pinia')
    let open = -1
    const app = createApp(
      defineComponent({
        setup() {
          const r = usePersonWorkItems('u1')
          return () => {
            open = r.items.value.length
            return null
          }
        },
      }),
    )
    app.use(getActivePinia()!).use(VueQueryPlugin, { queryClient })
    app.mount(document.createElement('div'))
    await settle()
    expect(open).toBe(4)
    expect(listRequests().length).toBe(before)
    app.unmount()
  })

  it('kişiye ait olmayan görev hiçbir sayıya girmez; tamamlanmış geç görev gecikmede değil', async () => {
    setup()
    const { wrapper } = await mountAt(PersonalTracking, { accountId: 'u1' })
    const value = (k: string) => wrapper.find(`[data-card="${k}"] [data-card-value]`).text()
    expect(value('tamamlanan')).toBe('%25')
    expect(value('acik')).toBe('3')
    expect(value('geciken')).toBe('1')
    expect(value('onayda')).toBe('1')
    // Onay bekleyen kartında not satırı yok (E-05-52).
    expect(wrapper.find('[data-card="onayda"] [data-card-note]').exists()).toBe(false)
    expect(wrapper.find('[data-work-item="w3"]').exists()).toBe(false)
  })

  it('yükleme hatası → bölge içi "Yeniden dene", yeniden okuma', async () => {
    let fail = true
    const { http, HttpResponse } = await import('msw')
    server.use(
      ...standingHandlers(),
      usersHandler([]),
      http.get('http://localhost/v1/program/work-items', () =>
        fail
          ? HttpResponse.json(
              { code: 'platform.rate_limited', message: 'x', request_id: 'r', fields: [] },
              { status: 429 },
            )
          : HttpResponse.json({ items: [ITEMS[0]] }),
      ),
    )
    const { wrapper } = await mountAt(PersonalTracking, { accountId: 'u1' })
    expect(wrapper.find('[data-load-error]').exists()).toBe(true)
    fail = false
    await wrapper.find('[data-load-error] button').trigger('click')
    await settle()
    expect(wrapper.find('[data-load-error]').exists()).toBe(false)
    expect(wrapper.find('[data-card="geciken"] [data-card-value]').text()).toBe('1')
  })
})

describe('kartlar, sekmeler, liste (E-05-49…67)', () => {
  it('varsayılan kart açık; kart değişimi URL kart, liste başlığı ve sekme sayacı aynı küme', async () => {
    setup()
    const { wrapper, router } = await mountAt(PersonalTracking, { accountId: 'u1' })
    expect(wrapper.find('[data-card="acik"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-list-caption]').text()).toBe('Açık görevler · 3 görev')
    expect(wrapper.find('[role="tab"][data-value="gorevler"]').text()).toContain('3')

    await wrapper.find('[data-card="tamamlanan"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.query.kart).toBe('tamamlanan')
    expect(wrapper.find('[data-list-caption]').text()).toBe('Tamamlanan görevler · 1 görev')
    expect(wrapper.find('[role="tab"][data-value="gorevler"]').text()).toContain('1')
    expect(wrapper.findAll('[data-work-item]').map((r) => r.attributes('data-work-item'))).toEqual([
      'w4',
    ])
  })

  it('gruplama: son tarih (Gecikmede / Bu hafta / Sonra) ↔ durum; URL grupla', async () => {
    setup()
    const { wrapper, router } = await mountAt(PersonalTracking, { accountId: 'u1' })
    const groups = () =>
      wrapper
        .findAll('[data-group]')
        .map((g) => [g.find('[role="cell"]').text(), g.find('[data-group-count]').text()])
    expect(groups()).toEqual([
      ['Gecikmede', '1'],
      ['Bu hafta', '1'],
      ['Sonra', '1'],
    ])
    const byStatus = wrapper.findAll('.rp-seg button')[1]!
    await byStatus.trigger('click')
    await settle()
    expect(router.currentRoute.value.query.grupla).toBe('durum')
    expect(groups()).toEqual([
      ['Devam ediyor', '1'],
      ['Onay bekliyor', '1'],
      ['Geri gönderildi', '1'],
    ])
  })

  it('satır: kod öneki + statik sıra, bitiş notu, kanıt "—", görev bağlantısı 03 paneline', async () => {
    setup()
    const { wrapper } = await mountAt(PersonalTracking, { accountId: 'u1' })
    const row = wrapper.find('[data-work-item="w1"]')
    expect(row.find('[data-code]').text()).toBe('MEK-—')
    expect(wrapper.find('[data-work-item="w5"] [data-code]').text()).toBe('')
    expect(row.find('[data-due-note]').text()).toBe('7 gün gecikti')
    expect(wrapper.find('[data-work-item="w2"] [data-due-note]').text()).toBe('2 gün kaldı')
    expect(row.find('[data-evidence]').text()).toBe('—')
    expect(row.find('a.rp-title').attributes('href')).toBe('/gorevler?gorev=w1')
    expect(row.find('a.rp-hoveract').attributes('aria-label')).toBe('Görev w1 görevini aç')
    expect(wrapper.find('[role="table"]').attributes('aria-label')).toBe('Bahar Kılıç görevleri')
  })

  it('takvim ay değişimi URL ay; başlık', async () => {
    setup()
    const { wrapper, router } = await mountAt(PersonalTracking, { accountId: 'u1' })
    expect(wrapper.find('[data-calendar-title]').text()).toBe('Son tarihler · Kasım')
    await wrapper.find('[data-month-next]').trigger('click')
    await settle()
    expect(router.currentRoute.value.query.ay).toBe('2026-12')
    expect(wrapper.find('[data-calendar-title]').text()).toBe('Son tarihler · Aralık')
  })

  it('Dosyalar sayaçsız + BE-046; Etkinlik BE-015, sahte olay yok', async () => {
    setup()
    const { wrapper } = await mountAt(
      PersonalTracking,
      { accountId: 'u1' },
      '/kullanicilar/u1?sekme=dosyalar',
    )
    const filesTab = wrapper.find('[role="tab"][data-value="dosyalar"]')
    expect(filesTab.find('.rp-count').exists()).toBe(false)
    expect(wrapper.find('[data-panel="dosyalar"] [data-design-stub="BE-046"]').exists()).toBe(true)

    await wrapper.find('[role="tab"][data-value="etkinlik"]').trigger('click')
    await settle()
    const panel = wrapper.find('[data-panel="etkinlik"]')
    expect(panel.find('[data-design-stub="BE-015"]').exists()).toBe(true)
    expect(panel.findAll('li')).toHaveLength(0)
    expect(panel.text()).not.toMatch(/\d/)
  })

  it('Hesap ve roller: 05 yan paneli gömülü; silinince kullanıcılar listesine', async () => {
    setup()
    const { wrapper, router } = await mountAt(
      PersonalTracking,
      { accountId: 'u1' },
      '/kullanicilar/u1?sekme=hesap',
    )
    const panel = wrapper.find('[data-user-panel="u1"]')
    expect(panel.attributes('data-embedded')).toBe('true')
    await panel.trigger('click')
    await settle()
    expect(router.currentRoute.value.name).toBe('organization.users')
  })
})

describe('başlık ve ad kaynağı (E-05-40…44)', () => {
  it('ad readUser ile; rol rozeti, birim ve e-posta (BE-041/043); belge başlığı', async () => {
    setup()
    const { wrapper } = await mountAt(PersonalTracking, { accountId: 'u1' })
    expect(wrapper.find('[data-person-name]').text()).toBe('Bahar Kılıç')
    expect(wrapper.find('[data-role]').text()).toBe('Üye')
    expect(wrapper.find('[data-units]').text()).toBe('Mekanik · u1@ornek.test')
    expect(wrapper.find('[data-email]').text()).toBe('u1@ornek.test')
    expect(document.title).toBe('RoketPortal — Bahar Kılıç')
    // E-05-40: kırıntının son parçası kişi adı.
    expect(pageCrumb.value).toBe('Bahar Kılıç')
    // Önbellekte yoktu: TEK `readUser`; `listUsers` taraması / ad araması yok.
    expect(requests.filter((r) => r.path === `${USERS}/u1`)).toHaveLength(1)
    expect(requests.filter((r) => r.path === USERS)).toHaveLength(0)
  })

  it('kişi hiçbir kaynakta yoksa "Bilinmeyen kişi"', async () => {
    server.use(...standingHandlers(), listHandler([ITEMS[2]!]), usersHandler([]))
    const { wrapper } = await mountAt(PersonalTracking, { accountId: 'u1' })
    expect(wrapper.find('[data-person-name]').text()).toBe('Bilinmeyen kişi')
    expect(wrapper.find('[data-role]').exists()).toBe(false)
    expect(wrapper.find('[data-assign]').attributes('disabled')).toBeDefined()
    // readUser 404 (BE-043).
    expect(requests.find((r) => r.path === `${USERS}/u1`)).toBeDefined()
  })

  it('sökülünce belge başlığı geri döner', async () => {
    document.title = 'Önceki'
    setup()
    const { wrapper } = await mountAt(PersonalTracking, { accountId: 'u1' })
    expect(document.title).toBe('RoketPortal — Bahar Kılıç')
    wrapper.unmount()
    expect(document.title).toBe('Önceki')
    expect(pageCrumb.value).toBeNull()
  })
})
