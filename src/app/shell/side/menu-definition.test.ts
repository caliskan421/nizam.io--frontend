// Rol menüsü tanımı (F6; E-00-41…47): rol × öğe matrisi, katalog bütünlüğü, mercek değişimi,
// rozet yerleşimi, `aria-current`, klavye sırası ve 390 px menü (SideNav bileşeni).
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ROUTES, ROUTE_NAMES, menuEntries } from '@/app/routes.catalog'
import type { ScopeFacts } from '@/shared/scope/standing-facts'
import type { ScopeLens } from '@/shared/scope/scope'

import SideNav from './SideNav.vue'
import {
  createFakeLifecycle,
  mountWithScope,
  setupWithScope,
  sideContext,
} from './__tests__/fake-lifecycle'
import type { TaskBadges } from './badges'
import { sideMenuGroups, useSideMenu } from './menu'
import {
  MENU_DEFINITION,
  MENU_ROLES,
  menuSlot,
  resolveMenuRole,
  type MenuRole,
} from './menu-definition'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

afterEach(() => {
  document.body.innerHTML = ''
})

const authority = (role: MenuRole) => ({
  ready: true,
  companyAdmin: role === 'admin',
  role,
})

function layout(role: MenuRole) {
  return sideMenuGroups(menuEntries(), authority(role)).map((g) => [
    g.group,
    g.entries.map((e) => [e.key, e.label]),
  ])
}

describe('rol × öğe matrisi (mekanizma §9; E-00-41, E-00-43, E-00-44, E-00-46)', () => {
  it('yönetici: Takip · İçerik · Yönetim; etiketler katalog adı', () => {
    expect(layout('admin')).toEqual([
      [
        'takip',
        [
          ['home', 'Ana sayfa'],
          ['tasks', 'Görevler'],
          ['gantt', 'Zaman çizelgesi'],
        ],
      ],
      [
        'icerik',
        [
          ['meetings', 'Toplantılar'],
          ['archive', 'Arşiv'],
        ],
      ],
      [
        'yonetim',
        [
          ['users', 'Kullanıcılar'],
          ['coords', 'Koordinatörlükler'],
          ['season', 'Teknofest ve sezon'],
        ],
      ],
    ])
  })

  it('koordinatör: Takip · İçerik; Yönetim, Birimim, Ekibim yok; Zaman çizelgesi korunur', () => {
    expect(layout('coordinator')).toEqual([
      [
        'takip',
        [
          ['home', 'Ana sayfa'],
          ['tasks', 'Görevler'],
          ['gantt', 'Zaman çizelgesi'],
        ],
      ],
      [
        'icerik',
        [
          ['meetings', 'Toplantılar'],
          ['archive', 'Arşiv'],
        ],
      ],
    ])
  })

  it('üye: Görevlerim, Zaman çizelgem, Dosyalarım (rol etiketi); yönetim ve birim grupları yok', () => {
    expect(layout('member')).toEqual([
      [
        'takip',
        [
          ['home', 'Ana sayfa'],
          ['tasks', 'Görevlerim'],
          ['gantt', 'Zaman çizelgem'],
        ],
      ],
      [
        'icerik',
        [
          ['meetings', 'Toplantılar'],
          ['archive', 'Dosyalarım'],
        ],
      ],
    ])
  })

  it('hiçbir rolde Raporlar öğesi ve /raporlar rotası yok (E-00-42, P47)', () => {
    for (const role of MENU_ROLES) {
      const labels = layout(role).flatMap(([, items]) => (items as string[][]).map((i) => i[1]))
      expect(labels.join('|')).not.toMatch(/rapor/i)
    }
    expect(Object.values(ROUTES).some((r) => (r.path as string) === '/raporlar')).toBe(false)
    expect(Object.values(ROUTES).filter((r) => 'menu' in r && /rapor/i.test(r.menu.key))).toEqual(
      [],
    )
  })

  it('Takvim, Kurumsal hafıza, Mesajlar, Tablolar, Birimim, Ekibim, Simülasyon hiçbir rolde yok', () => {
    const keys = new Set(
      MENU_ROLES.flatMap((role) =>
        layout(role).flatMap(([, items]) => (items as string[][]).map((i) => i[0])),
      ),
    )
    for (const hidden of [
      'calendar',
      'memory',
      'messages',
      'sheets',
      'unit',
      'team',
      'sim',
      'dates',
    ]) {
      expect(keys.has(hidden), hidden).toBe(false)
    }
  })

  it('katalogdaki her menü anahtarının tanımı var; tanımsız anahtar yok; üyede Yönetim yok', () => {
    const catalogKeys = ROUTE_NAMES.flatMap((n) => {
      const spec = ROUTES[n] as { menu?: { key: string } }
      return spec.menu ? [spec.menu.key] : []
    })
    expect(new Set(MENU_DEFINITION.map((d) => d.key))).toEqual(new Set(catalogKeys))
    for (const key of ['users', 'coords', 'season']) {
      expect(Object.keys(MENU_DEFINITION.find((d) => d.key === key)!.roles)).toEqual(['admin'])
    }
  })

  it('tanımsız anahtarlı katalog girdisi hiçbir menüde görünmez', () => {
    const [first] = menuEntries()
    const stray = { ...first!, key: 'tanimsiz' }
    for (const role of MENU_ROLES) {
      expect(menuSlot('tanimsiz', role)).toBeUndefined()
      expect(
        sideMenuGroups([stray], authority(role)).flatMap((g) => g.entries.map((e) => e.key)),
      ).toEqual([])
    }
  })

  it('sayfa başlığı rol etiketinden etkilenmez (§9.4): katalog adı değişmez', () => {
    expect(ROUTES['work.tasks'].title).toBe('Görevler')
    expect(ROUTES['archive.folders'].title).toBe('Arşiv')
    expect(ROUTES['work.timeline'].title).toBe('Zaman çizelgesi')
  })
})

describe('menü rolü seçimi (E-00-41; P1, P11, P53)', () => {
  const facts = (o: Partial<ScopeFacts>): ScopeFacts => ({
    companyAdmin: false,
    coordinator: false,
    member: false,
    ...o,
  })
  const pick = (f: ScopeFacts, lens: ScopeLens | null, ready = true) =>
    resolveMenuRole({ ready, ...f, lens })

  it('yönetici her mercekte yönetici menüsü', () => {
    for (const lens of ['admin', 'coordinator', 'member', null] as const) {
      expect(pick(facts({ companyAdmin: true, coordinator: true, member: true }), lens)).toBe(
        'admin',
      )
    }
  })

  it('standing gelmeden yönetici menüsü yok (nötr koordinatör düzeni, Yönetim yok)', () => {
    expect(pick(facts({ companyAdmin: true }), 'admin', false)).toBe('coordinator')
  })

  it('birleşik rolde mercek karar verir; mercek yoksa olguya göre', () => {
    const both = facts({ coordinator: true, member: true })
    expect(pick(both, 'coordinator')).toBe('coordinator')
    expect(pick(both, 'member')).toBe('member')
    expect(pick(facts({ member: true }), null)).toBe('member')
    expect(pick(both, null)).toBe('coordinator')
  })
})

async function menuFor(facts: ScopeFacts, lens: ScopeLens) {
  const ctx = await sideContext('/gorevler')
  const fake = createFakeLifecycle({ facts })
  fake.store.commit({ programId: 'p1', lens, departmentId: lens === 'admin' ? null : 'd1' })
  const menu = setupWithScope(ctx, fake.lifecycle, () => useSideMenu())
  await flushPromises()
  const keys = () => menu.groups.value.flatMap((g) => g.entries.map((e) => e.label))
  return { ...fake, menu, keys }
}

describe('dört kişilik senaryo — menü kümeleri (E-00-41)', () => {
  it('yönetici × üç mercek: menü aynı kalır, mercek yetki değildir', async () => {
    const { store, menu, lifecycle, keys } = await menuFor(
      { companyAdmin: true, coordinator: true, member: true },
      'admin',
    )
    const admin = keys()
    expect(admin).toContain('Kullanıcılar')
    for (const lens of ['coordinator', 'member', 'admin'] as const) {
      lifecycle.selectLens(lens)
      await flushPromises()
      expect(store.lens).toBe(lens)
      expect(keys()).toEqual(admin)
      expect(menu.role.value).toBe('admin')
    }
  })

  it('koordinatör ve üye merceği: ayrı menüler; mercek değişince menü yeniden hesaplanır', async () => {
    const { keys, lifecycle } = await menuFor(
      { companyAdmin: false, coordinator: true, member: true },
      'coordinator',
    )
    expect(keys()).toEqual(['Ana sayfa', 'Görevler', 'Zaman çizelgesi', 'Toplantılar', 'Arşiv'])
    lifecycle.selectLens('member')
    await flushPromises()
    expect(keys()).toEqual([
      'Ana sayfa',
      'Görevlerim',
      'Zaman çizelgem',
      'Toplantılar',
      'Dosyalarım',
    ])
    lifecycle.selectLens('coordinator')
    await flushPromises()
    expect(keys()).toContain('Arşiv')
  })

  it('yalnız üye: üye menüsü', async () => {
    const { keys } = await menuFor(
      { companyAdmin: false, coordinator: false, member: true },
      'member',
    )
    expect(keys()).toContain('Dosyalarım')
    expect(keys()).not.toContain('Kullanıcılar')
  })
})

const NO_BADGES: TaskBadges = { overdue: null, pendingDates: null, awaitingApproval: null }

function mountNav(role: MenuRole, badges: TaskBadges, props: Record<string, unknown> = {}) {
  return sideContext('/gorevler').then((ctx) => {
    const { lifecycle } = createFakeLifecycle()
    const groups = sideMenuGroups(menuEntries(), authority(role))
    return mountWithScope(ctx, lifecycle, SideNav, { groups, activeKey: 'tasks', badges, ...props })
  })
}

describe('rozet yerleşimi (E-00-45)', () => {
  const FULL: TaskBadges = { overdue: 3, pendingDates: 2, awaitingApproval: 5 }
  const kinds = (el: Element) =>
    [...el.querySelectorAll('[data-badge]')].map((b) => [
      b.getAttribute('data-badge'),
      b.textContent?.trim(),
    ])
  const item = (wrapper: Awaited<ReturnType<typeof mountNav>>, text: string) =>
    wrapper.findAll('a').find((a) => a.text().startsWith(text))!

  it('yönetici: Görevler = tarih talebi + geciken; Zaman çizelgesi rozetsiz', async () => {
    const w = await mountNav('admin', FULL)
    expect(kinds(item(w, 'Görevler').element)).toEqual([
      ['dates', '2'],
      ['overdue', '3'],
    ])
    expect(kinds(item(w, 'Zaman çizelgesi').element)).toEqual([])
  })

  it('koordinatör: Görevler = onay bekleyen + geciken; tarih talebi Zaman çizelgesi’nde', async () => {
    const w = await mountNav('coordinator', FULL)
    expect(kinds(item(w, 'Görevler').element)).toEqual([
      ['approval', '5'],
      ['overdue', '3'],
    ])
    expect(kinds(item(w, 'Zaman çizelgesi').element)).toEqual([['dates', '2']])
    const approval = w.get('[data-badge="approval"]')
    expect(approval.attributes('aria-label')).toBe('5 görev onay bekliyor')
    expect(w.get('[data-group="takip"] [data-badge="dates"]').attributes('aria-label')).toBe(
      '2 tarih değişikliği talebi bekliyor',
    )
  })

  it('üye: Görevlerim yalnız kendi geciken rozeti; tarih talebi ve onay rozeti hiç', async () => {
    const w = await mountNav('member', FULL)
    expect(kinds(item(w, 'Görevlerim').element)).toEqual([['overdue', '3']])
    expect(kinds(item(w, 'Zaman çizelgem').element)).toEqual([])
    expect(w.find('[data-badge="dates"]').exists()).toBe(false)
    expect(w.find('[data-badge="approval"]').exists()).toBe(false)
  })

  it('0 / null sayıda rozet çizilmez; dar menüde rozet yok', async () => {
    const empty = await mountNav('coordinator', { ...NO_BADGES, overdue: 0 })
    expect(empty.find('[data-badge]').exists()).toBe(false)
    const rail = await mountNav('coordinator', FULL, { rail: true })
    expect(rail.find('[data-badge]').exists()).toBe(false)
  })
})

describe('erişilebilirlik (KESİN 27/30)', () => {
  it('aria-current yalnız etkin öğede; öğeler gerçek bağlantı (klavye sırası = menü sırası)', async () => {
    const w = await mountNav('member', NO_BADGES)
    const links = w.findAll('a')
    expect(links.map((a) => a.text())).toEqual([
      'Ana sayfa',
      'Görevlerim',
      'Zaman çizelgem',
      'Toplantılar',
      'Dosyalarım',
    ])
    expect(
      links.filter((a) => a.attributes('aria-current') === 'page').map((a) => a.text()),
    ).toEqual(['Görevlerim'])
    expect(links.every((a) => a.attributes('tabindex') === undefined && a.attributes('href'))).toBe(
      true,
    )
    expect(w.findAll('p.rp-navlabel').map((p) => p.text())).toEqual(['Takip', 'İçerik'])
  })

  it('dar menü (rail): her öğede rol etiketiyle aria-label + title, görünür etiket yok', async () => {
    const w = await mountNav('member', NO_BADGES, { rail: true })
    const links = w.findAll('a')
    expect(links.map((a) => a.attributes('aria-label'))).toEqual([
      'Ana sayfa',
      'Görevlerim',
      'Zaman çizelgem',
      'Toplantılar',
      'Dosyalarım',
    ])
    expect(links.map((a) => a.attributes('title'))).toEqual(
      links.map((a) => a.attributes('aria-label')),
    )
    expect(w.find('p.rp-navlabel').exists()).toBe(false)
  })
})
