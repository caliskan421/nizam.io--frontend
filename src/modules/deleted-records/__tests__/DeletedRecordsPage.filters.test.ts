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

describe('istemci süzgeçleri URL ile gidip gelir (P43)', () => {
  it('arama gecikmeli URL q yazar; yüklenen kümede Türkçe katlamalı; sunucuya gitmez', async () => {
    world.tasks = [[task('w1', { title: 'Işık hattı' }), task('w2', { title: 'İzmir saha' })]]
    const page = await mountPage()
    const input = page.wrapper.get('[data-testid="dr-search"]')
    await input.setValue('ışık')
    expect(query(page).q).toBeUndefined()
    vi.advanceTimersByTime(300)
    await settle()
    expect(query(page).q).toBe('ışık')
    expect(ids(page)).toEqual(['w1'])
    expect(page.wrapper.get('[data-testid="dr-count"]').text()).toBe(
      '1 kayıt gösteriliyor (yüklenen 2 içinde)',
    )
    expect(sent(PATHS.tasks)).toHaveLength(1)
    expect(sent(PATHS.tasks)[0]!.query.get('q')).toBeNull()
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
    expect(page.wrapper.get('[data-record-key="gorev:w2"]').attributes('aria-current')).toBe('true')
    expect(page.wrapper.get('[data-testid="dr-search"]').element).toHaveProperty('value', 'motor')
  })

  it('koordinatörlük süzgeci menüden seçilir; adaylar yüklenen kümeden', async () => {
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
    expect(ids(page)).toEqual(['w2'])
    expect(page.wrapper.get('[data-testid="dr-department"] button').text()).toBe(
      'Koordinatörlük: Yazılım',
    )
  })

  it('süzgeç boş: "Bu filtrelerle kayıt yok." + Filtreleri temizle; imleç bitmediyse "daha fazla yükle" ipucu', async () => {
    world.tasks = [[task('w1', { title: 'Motor' })], [task('w2')]]
    const page = await mountPage({ path: '/silinen-kayitlar?q=zzz' })
    const state = page.wrapper.get('[data-testid="dr-state"]')
    expect(state.text()).toContain('Bu filtrelerle kayıt yok.')
    expect(state.text()).toContain('Yüklenen kayıtlarda yok, daha fazla yükle.')
    await state.get('[data-testid="dr-clear"]').trigger('click')
    await settle()
    expect(query(page).q).toBeUndefined()
    expect(ids(page)).toEqual(['w1'])
  })

  it('hiç silinmiş kayıt yok: "Silinmiş görev yok."', async () => {
    world.tasks = [[]]
    const page = await mountPage()
    expect(page.wrapper.get('[data-testid="dr-state"]').text()).toContain('Silinmiş görev yok.')
    expect(page.wrapper.find('[data-testid="dr-clear"]').exists()).toBe(false)
  })

  it('tür değişimi: kayit ve silen temizlenir; q ve aralik korunur; koordinatorluk hesapta düşer', async () => {
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
    expect(query(page).koordinatorluk).toBeUndefined()
  })
})

describe('Silen süzgeci yalnız toplantıda (E-12-18)', () => {
  it('toplantıda adaylar deleted_by; bilinmeyen silen "Bilinmiyor"', async () => {
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
      'Bilinmiyor',
    ])
    await page.wrapper.findAll('[role="menuitemradio"]')[3]!.trigger('click')
    await settle()
    expect(ids(page)).toEqual(['m3'])
    expect(query(page).silen).toBe('_bilinmiyor')
  })

  it('görev, koordinatörlük ve kullanıcıda silen süzgeci devre dışı; hesapta aralık da', async () => {
    world.accounts = [[account('a1')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=kullanici' })
    for (const id of ['dr-actor', 'dr-department', 'dr-range']) {
      expect(
        page.wrapper.get(`[data-testid="${id}"] button`).attributes('disabled'),
        id,
      ).toBeDefined()
    }
    await page.wrapper.get('[data-kind="gorev"]').trigger('click')
    await settle()
    expect(page.wrapper.get('[data-testid="dr-actor"] button').attributes('disabled')).toBeDefined()
    expect(
      page.wrapper.get('[data-testid="dr-range"] button').attributes('disabled'),
    ).toBeUndefined()
  })
})

describe('tarih aralığı (E-12-17): sayfa yükleyerek istemci süzgeci', () => {
  it('Son 7 gün: eşik aşılana kadar sayfa yüklenir, sonra durur', async () => {
    world.tasks = [
      [task('w1', { deleted_at: '2026-11-12T08:00:00Z' })],
      [task('w2', { deleted_at: '2026-11-10T08:00:00Z' })],
      [task('w3', { deleted_at: '2026-10-01T08:00:00Z' })],
      [task('w4', { deleted_at: '2026-09-01T08:00:00Z' })],
    ]
    const page = await mountPage({ path: '/silinen-kayitlar?aralik=7gun' })
    await settle()
    expect(ids(page)).toEqual(['w1', 'w2'])
    // w3 eşikten eski: yükleme orada durur, w4 istenmez.
    expect(sent(PATHS.tasks).map((r) => r.query.get('cursor'))).toEqual([null, '1', '2'])
    expect(page.wrapper.get('[data-testid="dr-count"]').text()).toContain('gösteriliyor')
  })

  it('menüden aralık seçilir ve URL aralik yazılır; Tümü ek yükleme yapmaz', async () => {
    world.tasks = [
      [
        task('w1', { deleted_at: '2026-11-12T08:00:00Z' }),
        task('w2', { deleted_at: '2026-10-12T08:00:00Z' }),
      ],
    ]
    const page = await mountPage()
    await pick(page, 'dr-range', 'Bugün')
    expect(query(page).aralik).toBe('bugun')
    expect(ids(page)).toEqual(['w1'])
    await pick(page, 'dr-range', 'Tümü')
    expect(query(page).aralik).toBeUndefined()
    expect(ids(page)).toEqual(['w1', 'w2'])
  })

  it('en çok 5 ardışık otomatik sayfa, sonra elle "Daha fazla yükle"', async () => {
    world.tasks = Array.from({ length: 9 }, (_, i) => [
      task(`w${i}`, { deleted_at: '2026-11-12T08:00:00Z' }),
    ])
    const page = await mountPage({ path: '/silinen-kayitlar?aralik=bugun' })
    await settle()
    expect(sent(PATHS.tasks)).toHaveLength(6)
    expect(page.wrapper.find('[data-testid="dr-more"]').exists()).toBe(true)
  })
})

describe('seçili kayıt paneli (E-12-37/41…54)', () => {
  it('ilk yüklemede seçim yok: "Bir kayıt seçin"; tıklama URL kayit yazar ve paneli doldurur', async () => {
    world.tasks = [
      [task('w1', { title: 'Saha pano montajı', file_count: 2, status: 'devam_ediyor' })],
    ]
    const page = await mountPage()
    expect(page.wrapper.get('[data-testid="dr-panel"]').text()).toContain('Bir kayıt seçin')
    await page.wrapper.get('[data-record-key="gorev:w1"]').trigger('click')
    await settle()
    expect(query(page).kayit).toBe('w1')
    const panel = page.wrapper.get('[data-testid="dr-panel"]').text()
    expect(panel).toContain('Saha pano montajı')
    expect(panel).toContain('Mekanik › Görevler')
    expect(panel).toContain('Devam ediyordu')
    expect(panel).toContain('birlikte geri gelecek')
    expect(panel).toContain('Kanıt dosyası')
    // Veri olmayan satırlar DOM'da yok.
    for (const absent of [
      'Atananlar',
      'Alt görev',
      'Yorum',
      'Tarih talebi',
      'Kalıcı silinme',
      '%',
    ]) {
      expect(panel, absent).not.toContain(absent)
    }
    // Silinmiş görevde ayrıntı okuması yok.
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

  it('hesap paneli: silinme ve silen satırı yok', async () => {
    world.accounts = [[account('a1')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=kullanici&kayit=a1' })
    const panel = page.wrapper.get('[data-testid="dr-panel"]').text()
    expect(panel).not.toContain('Silinme')
    expect(panel).not.toContain('Silen')
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
    const first = page.wrapper.get('[data-record-key="gorev:w1"]')
    ;(first.element as HTMLElement).focus()
    await first.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(page.wrapper.get('[data-record-key="gorev:w2"]').element)
    await page.wrapper.get('[data-record-key="gorev:w2"]').trigger('keydown', { key: 'Enter' })
    await settle()
    expect(query(page).kayit).toBe('w2')
  })

  it('toplantı satırında silen "Bilinmiyor", diğer türlerde "—" (sahte ad yok)', async () => {
    world.meetings = [[meeting('m1', { deleted_by: null })]]
    world.departments = [[department('d5', { deleted_at: '' })]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=toplanti' })
    expect(page.wrapper.get('.dr-actor').text()).toBe('Bilinmiyor')
    await page.wrapper.get('[data-kind="koordinatorluk"]').trigger('click')
    await settle()
    const cells = page.wrapper.findAll('[data-record-key] [role="cell"]')
    expect(cells[2]!.text()).toBe('—')
    expect(cells[3]!.text()).toBe('—')
  })
})
