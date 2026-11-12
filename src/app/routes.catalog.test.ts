import { describe, expect, it } from 'vitest'

import {
  COORDINATORSHIP_QUERY_KEYS,
  COORDINATORSHIP_TABS,
  COORDINATORSHIPS_QUERY_KEYS,
  COORDINATORSHIPS_SORT_FIELDS,
  COORDINATORSHIPS_VIEWS,
  USER_CARDS,
  USER_GROUPINGS,
  USER_QUERY_KEYS,
  USER_ROLE_TABS,
  USER_TABS,
  USERS_QUERY_KEYS,
} from '@/modules/organization/public'
import {
  TASKS_NEW_TASK_QUERY,
  TASKS_QUERY_KEYS,
  TASKS_SORT_FIELDS,
  TASKS_STATUS_FILTERS,
} from '@/modules/work/public'

import {
  activeMenuKey,
  CURRENT_PHASE,
  decodeParam,
  liveRouteNames,
  menuEntries,
  OPEN_STATES,
  type Phase,
  PHASES,
  parseRouteQuery,
  ROUTE_NAMES,
  routeLocation,
  routeSpec,
  routeTrail,
  ROUTES,
  visibilityOf,
} from './routes.catalog'

// ortak-kurallar §5 faz görünürlük matrisi (menü satırları + alt rotalar) — beklenen tablo.
const MATRIX: Record<string, Record<Phase, string>> = {
  home: { F0: 'canli', F1: 'canli', F2: 'canli', F3: 'canli', F4: 'canli', F5: 'canli' },
  'identity.session': {
    F0: 'canli',
    F1: 'canli',
    F2: 'canli',
    F3: 'canli',
    F4: 'canli',
    F5: 'canli',
  },
  'work.tasks': {
    F0: 'devre_disi',
    F1: 'canli',
    F2: 'canli',
    F3: 'canli',
    F4: 'canli',
    F5: 'canli',
  },
  'work.timeline': { F0: 'gizli', F1: 'gizli', F2: 'gizli', F3: 'canli', F4: 'canli', F5: 'canli' },
  'organization.users': {
    F0: 'gizli',
    F1: 'gizli',
    F2: 'canli',
    F3: 'canli',
    F4: 'canli',
    F5: 'canli',
  },
  'organization.user': {
    F0: 'gizli',
    F1: 'gizli',
    F2: 'canli',
    F3: 'canli',
    F4: 'canli',
    F5: 'canli',
  },
  'organization.coordinatorships': {
    F0: 'gizli',
    F1: 'gizli',
    F2: 'canli',
    F3: 'canli',
    F4: 'canli',
    F5: 'canli',
  },
  'organization.coordinatorship': {
    F0: 'gizli',
    F1: 'gizli',
    F2: 'canli',
    F3: 'canli',
    F4: 'canli',
    F5: 'canli',
  },
  // E-00-25 "Teknofest ve sezon" (W81): F2'de canlı, yalnız yönetici menüsünde.
  'program.programs': {
    F0: 'gizli',
    F1: 'gizli',
    F2: 'canli',
    F3: 'canli',
    F4: 'canli',
    F5: 'canli',
  },
  'collaboration.meetings': {
    F0: 'gizli',
    F1: 'gizli',
    F2: 'gizli',
    F3: 'gizli',
    F4: 'canli',
    F5: 'canli',
  },
  'collaboration.meeting': {
    F0: 'gizli',
    F1: 'gizli',
    F2: 'gizli',
    F3: 'gizli',
    F4: 'canli',
    F5: 'canli',
  },
  // F5 (W121): Arşiv 06/07; F4'e kadar gizli (F0–F4 dışı, K14).
  'archive.folders': {
    F0: 'gizli',
    F1: 'gizli',
    F2: 'gizli',
    F3: 'gizli',
    F4: 'gizli',
    F5: 'canli',
  },
  'archive.folder': {
    F0: 'gizli',
    F1: 'gizli',
    F2: 'gizli',
    F3: 'gizli',
    F4: 'gizli',
    F5: 'canli',
  },
}

const ROLE_SEGMENT =
  /^(admin|yonetici|yönetici|koordinator|koordinatör|uye|üye|coordinator|member)$/i

describe('rota kataloğu — yapı', () => {
  it('etkin faz F5: Arşiv de canlı', () => {
    expect(CURRENT_PHASE).toBe('F5')
    expect(visibilityOf('work.tasks')).toBe('canli')
    expect(visibilityOf('home')).toBe('canli')
    expect(liveRouteNames()).toEqual([
      'home',
      'identity.session',
      'work.tasks',
      'work.timeline',
      'organization.users',
      'organization.user',
      'organization.coordinatorships',
      'organization.coordinatorship',
      'program.programs',
      'collaboration.meetings',
      'collaboration.meeting',
      'archive.folders',
      'archive.folder',
    ])
    expect(liveRouteNames('F4')).not.toContain('archive.folders')
    expect(liveRouteNames('F2')).not.toContain('work.timeline')
    expect(liveRouteNames('F1')).toEqual(['home', 'identity.session', 'work.tasks'])
  })

  it('faz görünürlüğü ortak-kurallar §5 matrisiyle birebir', () => {
    expect(new Set(ROUTE_NAMES)).toEqual(new Set(Object.keys(MATRIX)))
    for (const name of ROUTE_NAMES) {
      for (const phase of PHASES) {
        expect(visibilityOf(name, phase), `${name} @ ${phase}`).toBe(MATRIX[name]?.[phase])
      }
    }
  })

  it('F0 rotaları: ana sayfa ve oturum (açık durumlar yerinde, URL’siz)', () => {
    expect(liveRouteNames('F0')).toEqual(['home', 'identity.session'])
    expect(Object.keys(OPEN_STATES)).toEqual([
      'state.update-required',
      'state.no-program',
      'state.membership-pending',
      'state.no-department',
      'state.logout-unverified',
    ])
  })

  it('v1 dışı modüller ve hedefsiz öğeler katalogda yok', () => {
    const paths = ROUTE_NAMES.map((name) => routeSpec(name).path)
    for (const banned of [
      '/mesajlar',
      '/islem-gecmisi',
      '/tablolar',
      '/takvim',
      '/kurumsal-hafiza',
      '/simulasyon',
    ]) {
      expect(
        paths.some((p) => p.startsWith(banned)),
        banned,
      ).toBe(false)
    }
    expect(ROUTE_NAMES.some((name) => /message|chat|assistant|help/i.test(name))).toBe(false)
  })

  it('rol önekli yol ya da ad yok (K10)', () => {
    for (const name of ROUTE_NAMES) {
      const segments = routeSpec(name).path.split('/').filter(Boolean)
      expect(
        segments.some((s) => ROLE_SEGMENT.test(s)),
        routeSpec(name).path,
      ).toBe(false)
      expect(ROLE_SEGMENT.test(name.split('.')[0] ?? ''), name).toBe(false)
    }
  })

  it('yollar tekil; yol parametreleri spesifikasyonla aynı', () => {
    const paths = ROUTE_NAMES.map((name) => routeSpec(name).path)
    expect(new Set(paths).size).toBe(paths.length)
    for (const name of ROUTE_NAMES) {
      const spec = routeSpec(name)
      const inPath = [...spec.path.matchAll(/:(\w+)/g)].map((m) => m[1])
      expect(inPath, name).toEqual(Object.keys(spec.params))
    }
  })

  it('üst rota geçerli, aynı fazda canlı; menü anahtarları tekil', () => {
    for (const name of ROUTE_NAMES) {
      const parent = routeSpec(name).parent
      if (!parent) continue
      expect(ROUTE_NAMES as string[]).toContain(parent)
      expect(routeSpec(name).phase >= routeSpec(parent as typeof name).phase).toBe(true)
    }
    const keys = ROUTE_NAMES.flatMap((name) => routeSpec(name).menu?.key ?? [])
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('menü', () => {
  it('etkin faz (F5): Arşiv de canlı; Silinen kayıtlar menüde yok (P36)', () => {
    expect(menuEntries().map((e) => [e.key, e.group, e.visibility])).toEqual([
      ['home', 'takip', 'canli'],
      ['tasks', 'takip', 'canli'],
      ['gantt', 'takip', 'canli'],
      ['meetings', 'icerik', 'canli'],
      ['archive', 'icerik', 'canli'],
      ['users', 'yonetim', 'canli'],
      ['coords', 'yonetim', 'canli'],
      ['season', 'yonetim', 'canli'],
    ])
  })

  it('F1: Ana sayfa ve Görevler canlı; diğerleri gizli', () => {
    expect(menuEntries('F1')).toEqual([
      {
        name: 'home',
        title: 'Ana sayfa',
        group: 'takip',
        key: 'home',
        visibility: 'canli',
        phase: 'F0',
      },
      {
        name: 'work.tasks',
        title: 'Görevler',
        group: 'takip',
        key: 'tasks',
        visibility: 'canli',
        phase: 'F1',
      },
    ])
  })

  it('F0: Ana sayfa canlı, Görevler devre dışı (F1’de); gizliler yok', () => {
    expect(menuEntries('F0')).toEqual([
      {
        name: 'home',
        title: 'Ana sayfa',
        group: 'takip',
        key: 'home',
        visibility: 'canli',
        phase: 'F0',
      },
      {
        name: 'work.tasks',
        title: 'Görevler',
        group: 'takip',
        key: 'tasks',
        visibility: 'devre_disi',
        phase: 'F1',
      },
    ])
  })

  it('F2: Yönetim grubu açılır; F4: Toplantılar İçerik grubunda, grup sırası takip → içerik → yönetim', () => {
    expect(menuEntries('F2').map((e) => e.key)).toEqual([
      'home',
      'tasks',
      'users',
      'coords',
      'season',
    ])
    expect(menuEntries('F4').map((e) => `${e.group}:${e.key}`)).toEqual([
      'takip:home',
      'takip:tasks',
      'takip:gantt',
      'icerik:meetings',
      'yonetim:users',
      'yonetim:coords',
      'yonetim:season',
    ])
  })

  it('alt rotalar üst menü öğesini etkin yapar; konum izi kökten yaprağa', () => {
    expect(activeMenuKey('archive.folder')).toBe('archive')
    expect(activeMenuKey('work.timeline')).toBe('gantt')
    expect(activeMenuKey('organization.user')).toBe('users')
    expect(activeMenuKey('collaboration.meeting')).toBe('meetings')
    expect(activeMenuKey('identity.session')).toBeUndefined()
    expect(routeTrail('organization.coordinatorship')).toEqual([
      'organization.coordinatorships',
      'organization.coordinatorship',
    ])
  })
})

describe('konum üretme ve süzgeç okuma', () => {
  it('canlı rota için tipli konum', () => {
    expect(routeLocation('home', {})).toEqual({ name: 'home', params: {}, query: {} })
  })

  it('canlı olmayan rotaya bağlantı üretilmez', () => {
    expect(() => routeLocation('work.tasks', {}, {}, 'F0')).toThrow(/canlı değil/)
    expect(() => routeLocation('work.timeline', {}, {}, 'F2')).toThrow(/canlı değil/)
    expect(() => routeLocation('organization.users', {}, {}, 'F1')).toThrow(/canlı değil/)
  })

  it('etkin fazda Görevler bağlantısı üretilir (sekme, talep, panel)', () => {
    expect(
      routeLocation('work.tasks', {}, { durum: 'geciken', talep: true, gorev: 'w-1' }),
    ).toEqual({
      name: 'work.tasks',
      params: {},
      query: { durum: 'geciken', talep: '1', gorev: 'w-1' },
    })
  })

  it('Zaman çizelgesi bağlantısı (F3): durum, departman, ölçek, seçili, altgörev tipli; geçersiz değer düşer', () => {
    expect(
      routeLocation(
        'work.timeline',
        {},
        { durum: 'geciken', departman: 'd-2', olcek: 'ay', secili: 'w-1', altgorev: 'kapali' },
      ),
    ).toEqual({
      name: 'work.timeline',
      params: {},
      query: { durum: 'geciken', departman: 'd-2', olcek: 'ay', secili: 'w-1', altgorev: 'kapali' },
    })
    expect(
      parseRouteQuery('work.timeline', { olcek: 'yil', durum: 'acik', departman: 'd 2', x: '1' }),
    ).toEqual({ durum: 'acik' })
  })

  it('Görevler "Yeni görev" girişi: yeni → 1 (E-03-06, W48)', () => {
    expect(routeLocation('work.tasks', {}, { yeni: true }).query).toEqual({ yeni: '1' })
    expect(routeLocation('work.tasks', {}, { yeni: true }).query).toEqual({
      ...TASKS_NEW_TASK_QUERY,
    })
    expect(parseRouteQuery('work.tasks', { yeni: '1' })).toEqual({ yeni: true })
  })

  it('Görevler süzgeçleri modülün URL okuyucusuyla aynı küme (work/routes.ts)', () => {
    const spec = routeSpec('work.tasks')
    expect(Object.keys(spec.query)).toEqual([...TASKS_QUERY_KEYS])
    expect(spec.query.durum).toEqual({ kind: 'enum', values: [...TASKS_STATUS_FILTERS] })
    expect(spec.query.sirala).toEqual({ kind: 'sort', fields: [...TASKS_SORT_FIELDS] })
  })

  it('organizasyon süzgeçleri modülün URL kümeleriyle aynı (organization/routes.ts)', () => {
    const users = routeSpec('organization.users')
    expect(Object.keys(users.query)).toEqual([...USERS_QUERY_KEYS])
    expect(users.query.rol).toEqual({ kind: 'enum', values: [...USER_ROLE_TABS] })
    const user = routeSpec('organization.user')
    expect(Object.keys(user.query)).toEqual([...USER_QUERY_KEYS])
    expect(user.query.sekme).toEqual({ kind: 'enum', values: [...USER_TABS] })
    expect(user.query.kart).toEqual({ kind: 'enum', values: [...USER_CARDS] })
    expect(user.query.grupla).toEqual({ kind: 'enum', values: [...USER_GROUPINGS] })
    const coords = routeSpec('organization.coordinatorships')
    expect(Object.keys(coords.query)).toEqual([...COORDINATORSHIPS_QUERY_KEYS])
    expect(coords.query.gorunum).toEqual({ kind: 'enum', values: [...COORDINATORSHIPS_VIEWS] })
    expect(coords.query.sirala).toEqual({
      kind: 'sort',
      fields: [...COORDINATORSHIPS_SORT_FIELDS],
    })
    const coord = routeSpec('organization.coordinatorship')
    expect(Object.keys(coord.query)).toEqual([...COORDINATORSHIP_QUERY_KEYS])
    expect(coord.query.sekme).toEqual({ kind: 'enum', values: [...COORDINATORSHIP_TABS] })
  })

  it('F2 organizasyon bağlantıları: rol sekmesi, 08 sıralama; devre dışı sekme/görünüm düşer', () => {
    expect(routeLocation('organization.users', {}, { rol: 'koordinator', q: 'ali' }).query).toEqual(
      { rol: 'koordinator', q: 'ali' },
    )
    expect(
      routeLocation('organization.coordinatorships', {}, { sirala: 'ad:azalan' }).query,
    ).toEqual({ sirala: 'ad:azalan' })
    expect(
      parseRouteQuery('organization.coordinatorships', { gorunum: 'yapi', sirala: 'x' }),
    ).toEqual({})
    expect(parseRouteQuery('organization.coordinatorship', { sekme: 'arsiv' })).toEqual({})
    expect(parseRouteQuery('organization.users', { rol: 'admin', sayfa: '2' })).toEqual({
      rol: 'admin',
    })
  })

  it('ileri fazda süzgeçler kodlanır (bool → 1/0, sıralama alan:yön)', () => {
    const location = routeLocation(
      'work.tasks',
      {},
      { durum: 'iade_edildi', talep: true, sirala: 'bitis:azalan', q: 'rapor' },
      'F1',
    )
    expect(location.query).toEqual({
      durum: 'iade_edildi',
      talep: '1',
      sirala: 'bitis:azalan',
      q: 'rapor',
    })
  })

  it('yol parametresi zorunlu ve doğrulanır', () => {
    expect(routeLocation('collaboration.meeting', { meetingId: 'm-1' }, {}, 'F4').params).toEqual({
      meetingId: 'm-1',
    })
    expect(() =>
      routeLocation('collaboration.meeting', {} as { meetingId: string }, {}, 'F4'),
    ).toThrow(/eksik/)
    expect(() => routeLocation('collaboration.meeting', { meetingId: 'a/b' }, {}, 'F4')).toThrow(
      /geçersiz/,
    )
  })

  it('toplantı detayı liste ve not filtrelerini katalogda doğrular', () => {
    const query = {
      zaman: 'gecmis',
      koordinatorluk: 'd',
      from: '2026-01-01',
      to: '2026-12-31',
      notlar: 'benim',
    } as const
    expect(routeLocation('collaboration.meeting', { meetingId: 'm' }, query, 'F4').query).toEqual(
      query,
    )
    expect(parseRouteQuery('collaboration.meeting', query)).toEqual(query)
  })

  it('Görevler kisi: virgüllü atanan kimlikleri üretilir ve okunur (BE-038)', () => {
    expect(routeLocation('work.tasks', {}, { kisi: 'a1,a2' }).query).toEqual({ kisi: 'a1,a2' })
    expect(parseRouteQuery('work.tasks', { kisi: 'a1,a2' })).toEqual({ kisi: 'a1,a2' })
  })

  it('geçersiz süzgeç değeri hatadır (üretimde), okumada düşer', () => {
    expect(() => routeLocation('work.tasks', {}, { durum: 'yok' as 'tamamlandi' }, 'F1')).toThrow(
      /geçersiz/,
    )
    expect(
      parseRouteQuery('work.tasks', {
        durum: 'yok',
        talep: '1',
        sirala: 'bitis:yukari',
        koordinatorluk: ['abc-1', null],
        kisi: 'abc-2,a/b',
        q: '   ',
        bilinmeyen: 'x',
      }),
    ).toEqual({ talep: true, koordinatorluk: 'abc-1' })
  })

  it.each([
    [{ kind: 'month' } as const, '2026-11', '2026-11'],
    [{ kind: 'month' } as const, '2026-13', undefined],
    [{ kind: 'bool' } as const, '0', false],
    [{ kind: 'bool' } as const, 'true', undefined],
    [{ kind: 'text' } as const, 'x'.repeat(300), 'x'.repeat(200)],
    [{ kind: 'id' } as const, '', undefined],
    [{ kind: 'ids' } as const, 'a-1,b_2', 'a-1,b_2'],
    [{ kind: 'ids' } as const, 'a,,b', undefined],
    [{ kind: 'ids' } as const, 'a,b c', undefined],
    [{ kind: 'ids' } as const, Array.from({ length: 51 }, (_, i) => `p${i}`).join(','), undefined],
    [{ kind: 'enum', values: ['a'] } as const, 'a', 'a'],
    [{ kind: 'sort', fields: ['gorev'] } as const, 'gorev:artan', 'gorev:artan'],
  ])('decodeParam(%o, %s)', (spec, raw, expected) => {
    expect(decodeParam(spec, raw)).toEqual(expected)
  })

  it('katalog nesnesi dışa açık ve değişmez biçimde okunur', () => {
    expect(ROUTES.home.path).toBe('/')
  })
})
