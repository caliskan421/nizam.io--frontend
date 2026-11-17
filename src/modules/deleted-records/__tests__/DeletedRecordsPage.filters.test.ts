import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  account,
  TEAM,
  department,
  meeting,
  mountPage,
  PATHS,
  resetAll,
  sent,
  server,
  serverDefaults,
  settle,
  task,
  world,
  type Mounted,
} from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['Date', 'setTimeout', 'clearTimeout'],
    now: new Date('2026-11-12T12:00:00Z'),
  })
  server.use(...serverDefaults())
  world.dictionary = [
    { department_id: 'd1', display_name: 'Mekanik' },
    { department_id: 'd2', display_name: 'Yazılım' },
  ]
})
afterEach(() => {
  vi.useRealTimers()
  resetAll()
})
afterAll(() => server.close())

const ids = (page: Mounted) =>
  page.wrapper
    .findAll('[data-record-key]')
    .map((r) => r.attributes('data-record-key')!.split(':')[1])
const query = (page: Mounted) => page.router.currentRoute.value.query

async function pick(page: Mounted, testId: string, label: string) {
  await page.wrapper.get(`[data-testid="${testId}"] button`).trigger('click')
  const item = page.wrapper.findAll('[role^="menuitem"]').find((el) => el.text() === label)!
  await item.trigger('click')
  await settle()
}

describe('süzgeçler URL ile gidip gelir, sunucuya gider (P43, BE-117)', () => {
  it('arama gecikmeli URL q yazar ve sunucuya q olarak gider (Türkçe katlamalı)', async () => {
    world.tasks = [[task('w1', { title: 'Işık hattı' }), task('w2', { title: 'İzmir saha' })]]
    const page = await mountPage()
    const input = page.wrapper.get('[data-testid="dr-search"]')
    await input.setValue('ışık')
    expect(query(page).q).toBeUndefined()
    vi.advanceTimersByTime(300)
    await settle()
    expect(query(page).q).toBe('ışık')
    expect(ids(page)).toEqual(['w1'])
    expect(page.wrapper.get('[data-testid="dr-count"]').text()).toBe('1 kayıt')
    // Yazım gecikmesi bitmeden sunucuya süzgeç gitmedi; sonra tek sorgu q taşır.
    expect(sent(PATHS.tasks)[0]!.query.get('q')).toBeNull()
    expect(sent(PATHS.tasks).at(-1)!.query.get('q')).toBe('ışık')
    expect(sent(PATHS.tasks)).toHaveLength(2)
  })

  it('URL ile açılış: q, koordinatorluk ve kayit durumu geri kurulur', async () => {
    world.tasks = [
      [
        task('w1', { title: 'Motor', department_id: 'd1' }),
        task('w2', { title: 'Motor yatağı', department_id: 'd2' }),
      ],
    ]
    const page = await mountPage({ path: '/silinen-kayitlar?q=motor&koordinatorluk=d2&kayit=w2' })
    expect(ids(page)).toEqual(['w2'])
    expect(page.wrapper.get('[data-testid="dr-panel"]').text()).toContain('Motor yatağı')
    expect(page.wrapper.get('[data-record-key="tasks:w2"]').attributes('aria-current')).toBe('true')
    expect(page.wrapper.get('[data-testid="dr-search"]').element).toHaveProperty('value', 'motor')
  })

  it('koordinatörlük süzgeci menüden seçilir; sunucuya department_id gider; adaylar sözlük + görülenler', async () => {
    world.tasks = [
      [
        task('w1', { department_id: 'd1' }),
        task('w2', { department_id: 'd2' }),
        task('w3', { department_id: 'dx' }),
      ],
    ]
    const page = await mountPage()
    await page.wrapper.get('[data-testid="dr-department"] button').trigger('click')
    expect(page.wrapper.findAll('[role="menuitemradio"]').map((i) => i.text())).toEqual([
      'Tümü',
      'Bilinmeyen koordinatörlük',
      'Mekanik',
      'Yazılım',
    ])
    await page.wrapper.findAll('[role="menuitemradio"]')[3]!.trigger('click')
    await settle()
    expect(query(page).koordinatorluk).toBe('d2')
    expect(sent(PATHS.tasks).at(-1)!.query.get('department_id')).toBe('d2')
    expect(ids(page)).toEqual(['w2'])
    expect(page.wrapper.get('[data-testid="dr-department"] button').text()).toBe(
      'Koordinatörlük: Yazılım',
    )
  })

  it('süzgeç boş: "Bu filtrelerle kayıt yok." + Filtreleri temizle (yüklenenlerde yok ayrımı yok)', async () => {
    world.tasks = [[task('w1', { title: 'Motor' })], [task('w2')]]
    const page = await mountPage({ path: '/silinen-kayitlar?q=zzz' })
    const state = page.wrapper.get('[data-testid="dr-state"]')
    expect(state.text()).toContain('Bu filtrelerle kayıt yok.')
    expect(state.text()).not.toMatch(/Yüklenen|daha fazla/)
    await state.get('[data-testid="dr-clear"]').trigger('click')
    await settle()
    expect(query(page).q).toBeUndefined()
    expect(ids(page)).toEqual(['w1'])
    // İmleç sıfırlandı: temizlenen sorgu ilk sayfadan başladı (cursor yok).
    expect(sent(PATHS.tasks).at(-1)!.query.has('cursor')).toBe(false)
  })

  it('hiç silinmiş kayıt yok: "Silinmiş görev yok."', async () => {
    world.tasks = [[]]
    const page = await mountPage()
    expect(page.wrapper.get('[data-testid="dr-state"]').text()).toContain('Silinmiş görev yok.')
    expect(page.wrapper.find('[data-testid="dr-clear"]').exists()).toBe(false)
  })

  it('tür değişimi: kayit ve silen temizlenir; q ve aralik korunur; koordinatorluk koordinatörlük türünde düşer', async () => {
    world.meetings = [[meeting('m1')]]
    world.accounts = [[account('a1')]]
    const page = await mountPage({
      path: '/silinen-kayitlar?tur=toplanti&q=a&aralik=tumu&koordinatorluk=d1&silen=acc-7&kayit=m1',
    })
    await page.wrapper.get('[data-kind="gorev"]').trigger('click')
    await settle()
    expect(query(page)).toMatchObject({ q: 'a', koordinatorluk: 'd1' })
    expect(query(page).kayit).toBeUndefined()
    expect(query(page).silen).toBeUndefined()
    await page.wrapper.get('[data-kind="kullanici"]').trigger('click')
    await settle()
    expect(query(page).q).toBe('a')
    // Hesapta "herhangi bir programdaki ekip satırı" süzgeci canlıdır (BE-118).
    expect(query(page).koordinatorluk).toBe('d1')
    await page.wrapper.get('[data-kind="koordinatorluk"]').trigger('click')
    await settle()
    expect(query(page).koordinatorluk).toBeUndefined()
  })
})

describe('Silen süzgeci dört türde (E-12-18, BE-108)', () => {
  it('toplantıda adaylar görülen deleted_by; "Bilinmiyor" seçeneği sunulmaz; seçim sunucuya deleted_by gider', async () => {
    world.meetings = [
      [
        meeting('m1'),
        meeting('m2', { deleted_by: { account_id: 'acc-8', full_name: 'Mevlüt Kayacan' } }),
        meeting('m3', { deleted_by: null }),
      ],
    ]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=toplanti' })
    await page.wrapper.get('[data-testid="dr-actor"] button').trigger('click')
    expect(page.wrapper.findAll('[role="menuitemradio"]').map((i) => i.text())).toEqual([
      'Tümü',
      'Reha Koçak',
      'Mevlüt Kayacan',
    ])
    await page.wrapper.findAll('[role="menuitemradio"]')[2]!.trigger('click')
    await settle()
    expect(sent(PATHS.meetings).at(-1)!.query.get('deleted_by')).toBe('acc-8')
    expect(ids(page)).toEqual(['m2'])
    expect(query(page).silen).toBe('acc-8')
  })

  it('silen ve aralık süzgeci dört türde etkin; koordinatörlük süzgeci yalnız koordinatörlükte devre dışı', async () => {
    world.accounts = [[account('a1')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=kullanici' })
    const disabled = (id: string) =>
      page.wrapper.get(`[data-testid="${id}"] button`).attributes('disabled') !== undefined
    expect([disabled('dr-actor'), disabled('dr-department'), disabled('dr-range')]).toEqual([
      false,
      false,
      false,
    ])
    await page.wrapper.get('[data-kind="koordinatorluk"]').trigger('click')
    await settle()
    expect([disabled('dr-actor'), disabled('dr-department'), disabled('dr-range')]).toEqual([
      false,
      true,
      false,
    ])
  })

  it('silen süzgeci görev, koordinatörlük ve kullanıcıda da sunucuya deleted_by gider', async () => {
    const by = { account_id: 'acc-7', full_name: 'Reha Koçak' }
    const other = { account_id: 'acc-8', full_name: 'Ali Avcı' }
    world.tasks = [[task('w1', { deleted_by: by }), task('w2', { deleted_by: other })]]
    world.departments = [
      [department('d5', { deleted_by: by }), department('d6', { deleted_by: other })],
    ]
    world.accounts = [[account('a1', { deleted_by: by }), account('a2', { deleted_by: other })]]
    const page = await mountPage()
    const expected = {
      gorev: [PATHS.tasks, ['w1']],
      koordinatorluk: [PATHS.departments, ['d5']],
      kullanici: [PATHS.accounts, ['a1']],
    } as const
    for (const [kind, [path, shown]] of Object.entries(expected)) {
      await page.wrapper.get(`[data-kind="${kind}"]`).trigger('click')
      await settle()
      await pick(page, 'dr-actor', 'Reha Koçak')
      expect(sent(path).at(-1)!.query.get('deleted_by'), kind).toBe('acc-7')
      expect(ids(page), kind).toEqual(shown)
      expect(query(page).silen).toBe('acc-7')
    }
  })

  it('kullanıcı: varsayılan sıra sort=deleted_at&order=desc; aralık ve koordinatörlük sunucuya gider (BE-118)', async () => {
    world.accounts = [
      [
        account('a1', {
          full_name: 'Eski',
          deleted_at: '2026-09-01T10:00:00Z',
          teams: [TEAM('d1', 'Mekanik')],
        }),
        account('a2', {
          full_name: 'Yeni',
          deleted_at: '2026-11-12T08:00:00Z',
          teams: [TEAM('d2', 'Yazılım')],
        }),
        account('a3', {
          full_name: 'Orta',
          deleted_at: '2026-11-10T08:00:00Z',
          teams: [TEAM('d2', 'Yazılım')],
        }),
      ],
    ]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=kullanici' })
    const first = sent(PATHS.accounts)[0]!.query
    expect([first.get('sort'), first.get('order')]).toEqual(['deleted_at', 'desc'])
    expect(ids(page)).toEqual(['a2', 'a3', 'a1'])
    await pick(page, 'dr-range', 'Son 7 gün')
    expect(sent(PATHS.accounts).at(-1)!.query.get('deleted_from')).toBe('2026-11-05T21:00:00Z')
    expect(ids(page)).toEqual(['a2', 'a3'])
    await pick(page, 'dr-department', 'Mekanik')
    expect(sent(PATHS.accounts).at(-1)!.query.get('department_id')).toBe('d1')
    expect(ids(page)).toEqual([])
    // Hesap satırında silinme tarihi hücresi dolu (eskiden "—" idi).
    await page.wrapper.get('[data-testid="dr-clear"]').trigger('click')
    await settle()
    expect(page.wrapper.findAll('.dr-dt__d')[0]!.text()).toContain('12.11.2026')
  })
})

describe('tarih aralığı (E-12-17): sunucu deleted_from', () => {
  it('Son 7 gün: tek istek, kurulum günü başı deleted_from; otomatik sayfa yükleme yok', async () => {
    world.tasks = [
      [task('w1', { deleted_at: '2026-11-12T08:00:00Z' })],
      [task('w2', { deleted_at: '2026-11-10T08:00:00Z' })],
      [task('w3', { deleted_at: '2026-10-01T08:00:00Z' })],
    ]
    const page = await mountPage({ path: '/silinen-kayitlar?aralik=7gun' })
    await settle()
    expect(ids(page)).toEqual(['w1'])
    expect(sent(PATHS.tasks)).toHaveLength(1)
    // Istanbul: 12 Kasım gününden önceki 6 gün → 6 Kasım değil 5 Kasım 21:00Z (UTC gün sınırı değil).
    expect(sent(PATHS.tasks)[0]!.query.get('deleted_from')).toBe('2026-11-05T21:00:00Z')
    expect(page.wrapper.get('[data-testid="dr-count"]').text()).toBe('1 / 2 kayıt gösteriliyor')
  })

  it('menüden aralık seçilir; URL aralik yazılır; Tümü deleted_from göndermez', async () => {
    world.tasks = [
      [
        task('w1', { deleted_at: '2026-11-12T08:00:00Z' }),
        task('w2', { deleted_at: '2026-10-12T08:00:00Z' }),
      ],
    ]
    const page = await mountPage()
    await pick(page, 'dr-range', 'Bugün')
    expect(query(page).aralik).toBe('bugun')
    expect(sent(PATHS.tasks).at(-1)!.query.get('deleted_from')).toBe('2026-11-11T21:00:00Z')
    expect(ids(page)).toEqual(['w1'])
    await pick(page, 'dr-range', 'Tümü')
    expect(query(page).aralik).toBeUndefined()
    expect(sent(PATHS.tasks).at(-1)!.query.has('deleted_from')).toBe(false)
    expect(ids(page)).toEqual(['w1', 'w2'])
  })
})

describe('sıralama başlığı (E-12-31)', () => {
  it('başlık tıklanır: sunucu sort/order gider, sıra değişir, aria-sort işaretlenir', async () => {
    world.tasks = [
      [
        task('w1', { title: 'Beta' }),
        task('w2', { title: 'Alfa' }),
        task('w3', { title: 'Çelik' }),
      ],
    ]
    const page = await mountPage()
    expect(sent(PATHS.tasks)[0]!.query.has('sort')).toBe(false)
    await page.wrapper.get('[data-sort="name"]').trigger('click')
    await settle()
    const last = sent(PATHS.tasks).at(-1)!.query
    expect([last.get('sort'), last.get('order')]).toEqual(['name', 'asc'])
    expect(ids(page)).toEqual(['w2', 'w1', 'w3'])
    expect(page.wrapper.get('[aria-sort]').attributes('aria-sort')).toBe('ascending')
    await page.wrapper.get('[data-sort="name"]').trigger('click')
    await settle()
    expect(sent(PATHS.tasks).at(-1)!.query.get('order')).toBe('desc')
    expect(ids(page)).toEqual(['w3', 'w1', 'w2'])
  })
})

describe('seçili kayıt paneli (E-12-37/41…54)', () => {
  it('ilk yüklemede seçim yok: "Bir kayıt seçin"; tıklama URL kayit yazar ve paneli doldurur', async () => {
    world.tasks = [
      [task('w1', { title: 'Saha pano montajı', file_count: 2, status: 'devam_ediyor' })],
    ]
    const page = await mountPage()
    expect(page.wrapper.get('[data-testid="dr-panel"]').text()).toContain('Bir kayıt seçin')
    await page.wrapper.get('[data-record-key="tasks:w1"]').trigger('click')
    await settle()
    expect(query(page).kayit).toBe('w1')
    const panel = page.wrapper.get('[data-testid="dr-panel"]').text()
    expect(panel).toContain('Saha pano montajı')
    expect(panel).toContain('Mekanik › Görevler')
    expect(panel).toContain('Devam ediyordu')
    expect(panel).toContain('birlikte geri gelecek')
    expect(panel).toContain('Kanıt dosyası')
    // Alt görev/yorum/tarih talebi sayıları liste öğesinden gelir (BE-113); kalıcı silinme yok.
    for (const present of ['Alt görev', 'Yorum', 'Tarih talebi']) {
      expect(panel, present).toContain(present)
    }
    for (const absent of ['Kalıcı silinme', '%']) {
      expect(panel, absent).not.toContain(absent)
    }
    // Silinmiş görevde ayrıntı okuması yok.
    expect(sent('/v1/work-items/w1')).toHaveLength(0)
  })

  it('görev paneli (BE-113): atananlar, yüzde, birlikte geri gelecek sayıları; koordinatörlükle silinen not taşır', async () => {
    world.tasks = [
      [
        task('w1', {
          title: 'Saha pano montajı',
          deleted_by_department: true,
          assignees: [
            { account_id: 'a1', full_name: 'Reha Koçak' },
            { account_id: 'a2', full_name: 'Ali Avcı' },
          ],
          subtask_counts: { total: 5, done: 2 },
          note_count: 7,
          file_count: 2,
          pending_date_request: {
            request_id: 'r1',
            created_at: '2026-11-10T08:00:00Z',
            new_start_on: '2026-12-01',
            new_end_on: '2026-12-10',
          },
        }),
      ],
    ]
    const page = await mountPage({ path: '/silinen-kayitlar?kayit=w1' })
    const panel = page.wrapper.get('[data-testid="dr-panel"]')
    expect(panel.get('[data-testid="dr-assignees"]').text()).toBe('Reha Koçak, Ali Avcı')
    expect(panel.text()).toContain('Devam ediyordu · %40')
    expect(panel.text()).toContain('koordinatörlükle birlikte silindi')
    const counts = Object.fromEntries(
      panel
        .findAll('[data-linked]')
        .map((li) => [li.attributes('data-linked'), li.get('.rp-count').text()]),
    )
    expect(counts).toEqual({ subtasks: '5', files: '2', notes: '7', dateRequest: '1' })
    // Silinmiş görevde ayrıntı okuması yok: sayılar liste öğesinden gelir.
    expect(sent('/v1/work-items/w1')).toHaveLength(0)
  })

  it('toplantı paneli: silen, yer, davet kipi, koordinatörlükler; "birlikte geri gelecek" yok', async () => {
    world.meetings = [[meeting('m1', { place: 'Fuar alanı' })]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=toplanti&kayit=m1' })
    const panel = page.wrapper.get('[data-testid="dr-panel"]').text()
    expect(panel).toContain('Reha Koçak')
    expect(panel).toContain('Fuar alanı')
    expect(panel).toContain('Koordinatörlük')
    expect(panel).not.toContain('birlikte geri gelecek')
  })

  it('hesap paneli: silen, silinme tarihi ve ekipler', async () => {
    world.accounts = [[account('a1', { teams: [TEAM('d1', 'Mekanik')], company_admin: true })]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=kullanici&kayit=a1' })
    const panel = page.wrapper.get('[data-testid="dr-panel"]').text()
    expect(panel).toContain('Silinme')
    expect(panel).toContain('Mekanik')
    expect(panel).toContain('Şirket yöneticisi')
    expect(panel).toContain('Silen')
  })

  it('kayit yüklenen sayfalarda yoksa ipucu; seçim sessizce temizlenmez', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage({ path: '/silinen-kayitlar?kayit=yok' })
    expect(page.wrapper.get('[data-testid="dr-panel"]').text()).toContain(
      'Kayıt yüklenen sayfalarda yok.',
    )
    expect(query(page).kayit).toBe('yok')
  })

  it('Enter ve ok tuşları: satır seçer / komşu satıra geçer', async () => {
    world.tasks = [[task('w1'), task('w2')]]
    const page = await mountPage()
    const first = page.wrapper.get('[data-record-key="tasks:w1"]')
    ;(first.element as HTMLElement).focus()
    await first.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(page.wrapper.get('[data-record-key="tasks:w2"]').element)
    await page.wrapper.get('[data-record-key="tasks:w2"]').trigger('keydown', { key: 'Enter' })
    await settle()
    expect(query(page).kayit).toBe('w2')
  })

  it('silen bilinmeyen eski kayıtlarda "Bilinmiyor" (sahte ad yok); silinme tarihi boşsa "—"', async () => {
    world.meetings = [[meeting('m1', { deleted_by: null })]]
    world.departments = [[department('d5', { deleted_at: '' })]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=toplanti' })
    expect(page.wrapper.get('.dr-actor').text()).toBe('Bilinmiyor')
    await page.wrapper.get('[data-kind="koordinatorluk"]').trigger('click')
    await settle()
    const cells = page.wrapper.findAll('[data-record-key] [role="cell"]')
    // Hücreler: seçim kutusu, tür, kayıt, silinme tarihi, silen, işlemler.
    expect(cells[3]!.text()).toBe('—')
    expect(cells[4]!.text()).toBe('Bilinmiyor')
  })
})
