// Rota kataloğu (yol haritası K10) — router'ın, kenar menüsünün, konum izinin ve F46 asistan
// görünüm kataloğunun TEK kaynağı: tipli ad → yol → tipli parametre/süzgeç, menü grubu, faz
// görünürlüğü (ortak-kurallar §5). URL özelliğe göredir; rol öneki yok (lint + test).
//
// Kurallar:
// - Yalnız v1 (F0–F4) ekranları; v1 dışı modüller (Arşiv F5, Mesajlar F7, İşlem geçmişi, Tablolar,
//   Takvim, Kurumsal hafıza, Simülasyon) ve hedefi tanımsız öğeler (Teknofest ve sezon, Yardım,
//   Asistan) katalogda YOKTUR.
// - Router yalnız `CURRENT_PHASE`'te `canli` olan rotaları kaydeder; diğerleri bilinmeyen yol gibi
//   davranır. Menü `gizli` öğeyi göstermez, `devre_disi` öğeyi faz notuyla tıklanamaz gösterir.
// - Kapsam (program/departman/mercek) URL'ye yazılmaz (K2; 00-ortak kabul E-00-04).
// - Parametre ve süzgeç adları grup README "Rota (önerilen, K10)" satırlarından; katalog son
//   sözü söyler (ad uyumu, rol değeri taşıyan süzgeçlerin dışarıda bırakılması — bkz. girdiler).
import type { ScopeClass } from '@/shared/scope/scope-class'

export const PHASES = ['F0', 'F1', 'F2', 'F3', 'F4'] as const
export type Phase = (typeof PHASES)[number]

/** Etkin faz. Faz açılışında tek satır değişir; görünürlük matrisi buradan türetilir. */
export const CURRENT_PHASE: Phase = 'F0'

export type Visibility = 'canli' | 'gizli' | 'devre_disi'
export type MenuGroup = 'takip' | 'icerik' | 'yonetim'
export const MENU_GROUPS: readonly MenuGroup[] = ['takip', 'icerik', 'yonetim']

// --- Parametre / süzgeç tipleri -------------------------------------------------------------

export type SortDirection = 'artan' | 'azalan'

export type ParamSpec =
  | { readonly kind: 'id' }
  | { readonly kind: 'text' }
  | { readonly kind: 'bool' }
  | { readonly kind: 'month' }
  | { readonly kind: 'enum'; readonly values: readonly string[] }
  | { readonly kind: 'sort'; readonly fields: readonly string[] }

const id = { kind: 'id' } as const
const text = { kind: 'text' } as const
const bool = { kind: 'bool' } as const
const month = { kind: 'month' } as const
function oneOf<const V extends readonly string[]>(values: V) {
  return { kind: 'enum', values } as const
}
function sortBy<const F extends readonly string[]>(fields: F) {
  return { kind: 'sort', fields } as const
}

/** Spesifikasyondan değer tipi. */
export type ParamValue<S> = S extends { kind: 'enum'; values: readonly (infer V)[] }
  ? V
  : S extends { kind: 'sort'; fields: readonly (infer F extends string)[] }
    ? `${F}:${SortDirection}`
    : S extends { kind: 'bool' }
      ? boolean
      : string

export interface RouteMenu {
  readonly group: MenuGroup
  /** Kenar menüsü kimliği / simge anahtarı (`Sidebar.dc.html` `active`). */
  readonly key: string
  readonly order: number
}

export interface RouteSpec {
  readonly path: string
  /** Sayfa adı: konum izinin son parçası ve menü etiketi (TR; v1 tek dil). */
  readonly title: string
  readonly scope: ScopeClass
  /** Rotanın canlı olduğu faz. */
  readonly phase: Phase
  /** Canlı fazdan önce menüde: `gizli` (varsayılan) ya da `devre_disi` (faz notuyla görünür). */
  readonly before?: 'gizli' | 'devre_disi'
  readonly menu?: RouteMenu
  /** Etkin menü öğesi ve konum izi için üst rota (08b → Koordinatörlükler). */
  readonly parent?: string
  /** Yol parametreleri (`:ad`), yoldaki sırayla. */
  readonly params: Readonly<Record<string, ParamSpec>>
  /** Sorgu dizgisindeki süzgeçler; hepsi isteğe bağlı. */
  readonly query: Readonly<Record<string, ParamSpec>>
}

// --- Katalog ---------------------------------------------------------------------------------

export const ROUTES = {
  home: {
    path: '/',
    title: 'Ana sayfa',
    // F0'da kabuk + kapsam. F1 notu: 01 sade ana sayfa (O3, W51) S2/S3 uçlarını sayfa içinden
    // okur; rota kapsamı S1 kalır (kapsam kabukta seçilir, sayfa kapsamsızken açık durum).
    scope: 'S1',
    phase: 'F0',
    menu: { group: 'takip', key: 'home', order: 1 },
    params: {},
    query: {},
  },
  'identity.session': {
    path: '/oturum',
    title: 'Oturum',
    scope: 'S0',
    phase: 'F0',
    params: {},
    query: {},
  },
  'work.tasks': {
    path: '/gorevler',
    title: 'Görevler',
    scope: 'S2',
    phase: 'F1',
    // ortak-kurallar §5: F0'da menüde görünür (devre dışı), F1'de canlı (`CURRENT_PHASE`).
    before: 'devre_disi',
    menu: { group: 'takip', key: 'tasks', order: 2 },
    params: {},
    // 03 README satır dışı varsayımlar (kabul): `kisi` F1'de yok (E-03-11 statik, BE-038);
    // sayfa/imleç URL'de taşınmaz (E-03-39); panel sekmesi bellekte (E-03-45).
    query: {
      durum: oneOf(['baslanmadi', 'devam_ediyor', 'onaya_sunuldu', 'iade_edildi', 'tamamlandi']),
      talep: bool,
      q: text,
      koordinatorluk: id,
      sirala: sortBy(['gorev', 'durum', 'bitis']),
      gorev: id,
    },
  },
  'work.timeline': {
    path: '/zaman-cizelgesi',
    title: 'Zaman çizelgesi',
    scope: 'S2',
    phase: 'F3',
    parent: 'work.tasks',
    params: {},
    // `departman` süzgeci yok: birim kenar menüsünden seçilir (K3, BE-058).
    query: {
      durum: oneOf(['tumu', 'acik', 'geciken', 'biten']),
      olcek: oneOf(['gun', 'hafta', 'ay']),
      secili: id,
      altgorev: oneOf(['kapali', 'tumu']),
    },
  },
  'organization.users': {
    path: '/kullanicilar',
    title: 'Kullanıcılar',
    scope: 'S1',
    phase: 'F2',
    menu: { group: 'yonetim', key: 'users', order: 1 },
    params: {},
    // `rol` sekmesi F2'de capability ile bağlanır (rol değeri katalogda taşınmaz, K1 lint).
    query: { q: text, koordinatorluk: id, secili: id },
  },
  'organization.user': {
    path: '/kullanicilar/:accountId',
    title: 'Kişisel takip',
    scope: 'S2',
    phase: 'F2',
    parent: 'organization.users',
    params: { accountId: id },
    query: {
      sekme: oneOf(['gorevler', 'dosyalar', 'etkinlik', 'hesap']),
      kart: oneOf(['tamamlanan', 'acik', 'geciken', 'onayda']),
      grupla: oneOf(['son-tarih', 'durum']),
      ay: month,
    },
  },
  'organization.coordinatorships': {
    path: '/koordinatorlukler',
    title: 'Koordinatörlükler',
    scope: 'S2',
    phase: 'F2',
    menu: { group: 'yonetim', key: 'coords', order: 2 },
    params: {},
    // `sirala` değer kümesi tasarımda tanımsız → F2 açılışında.
    query: { gorunum: oneOf(['liste', 'yapi']), q: text },
  },
  'organization.coordinatorship': {
    path: '/koordinatorlukler/:departmentId',
    title: 'Koordinatörlük',
    scope: 'S2',
    phase: 'F2',
    parent: 'organization.coordinatorships',
    params: { departmentId: id },
    query: {
      sekme: oneOf(['genel', 'uyeler', 'gorevler', 'arsiv', 'toplantilar', 'ayarlar']),
    },
  },
  'collaboration.meetings': {
    path: '/toplantilar',
    title: 'Toplantılar',
    scope: 'S2',
    phase: 'F4',
    menu: { group: 'icerik', key: 'meetings', order: 1 },
    params: {},
    query: { zaman: oneOf(['yaklasan', 'gecmis', 'silinenler']), koordinatorluk: id },
  },
  'collaboration.meeting': {
    path: '/toplantilar/:meetingId',
    title: 'Toplantı',
    scope: 'S2',
    phase: 'F4',
    parent: 'collaboration.meetings',
    params: { meetingId: id },
    query: { notlar: oneOf(['tumu', 'gorev', 'benim']) },
  },
} as const satisfies Record<string, RouteSpec>

export type RouteName = keyof typeof ROUTES
type Catalog = typeof ROUTES

export type RouteParams<N extends RouteName> = {
  [K in keyof Catalog[N]['params']]: string
}
export type RouteQuery<N extends RouteName> = {
  [K in keyof Catalog[N]['query']]?: ParamValue<Catalog[N]['query'][K]>
}

/**
 * Açık durum ekranları (K7; 00-ortak mekanizma §6). URL'leri yoktur: kabuk içeriği yerine
 * yerinde gösterilir ("güncelleme gerekli" ile aynı kalıp); kapsam düzelince kullanıcı aynı
 * rotada kalır. Katalog adlarını ve konum izi başlığını verir; bileşenler `app/states/`.
 */
export const OPEN_STATES = {
  'state.update-required': { title: 'Güncelleme gerekli', phase: 'F0' },
  'state.no-program': { title: 'Program yok', phase: 'F0' },
  'state.membership-pending': { title: 'Departman ataması bekleniyor', phase: 'F0' },
  'state.no-department': { title: 'Programa departman katılmamış', phase: 'F0' },
  'state.logout-unverified': { title: 'Sunucu çıkışı doğrulanamadı', phase: 'F0' },
} as const satisfies Record<string, { title: string; phase: Phase }>
export type OpenStateName = keyof typeof OPEN_STATES

// --- Sorgular --------------------------------------------------------------------------------

export function isRouteName(name: unknown): name is RouteName {
  return typeof name === 'string' && Object.hasOwn(ROUTES, name)
}

export function routeSpec(name: RouteName): RouteSpec {
  return ROUTES[name]
}

export const ROUTE_NAMES = Object.keys(ROUTES) as RouteName[]

function phaseIndex(phase: Phase): number {
  return PHASES.indexOf(phase)
}

/** Faz görünürlüğü (ortak-kurallar §5): canlı fazdan itibaren `canli`, öncesinde `before`. */
export function visibilityOf(name: RouteName, phase: Phase = CURRENT_PHASE): Visibility {
  const spec = routeSpec(name)
  if (phaseIndex(phase) >= phaseIndex(spec.phase)) return 'canli'
  return spec.before ?? 'gizli'
}

/** Router'a girecek rotalar. */
export function liveRouteNames(phase: Phase = CURRENT_PHASE): RouteName[] {
  return ROUTE_NAMES.filter((name) => visibilityOf(name, phase) === 'canli')
}

export interface MenuEntry {
  readonly name: RouteName
  readonly title: string
  readonly group: MenuGroup
  readonly key: string
  readonly visibility: Exclude<Visibility, 'gizli'>
  /** `devre_disi` öğe için canlı olacağı faz ("F1'de"). */
  readonly phase: Phase
}

/** Kenar menüsü girdileri: gizliler yok; grup sırası, sonra öğe sırası. Capability süzgeci W21'de. */
export function menuEntries(phase: Phase = CURRENT_PHASE): MenuEntry[] {
  const ranked: [number, MenuEntry][] = []
  for (const name of ROUTE_NAMES) {
    const spec = routeSpec(name)
    const visibility = visibilityOf(name, phase)
    if (!spec.menu || visibility === 'gizli') continue
    const { group, key, order } = spec.menu
    const rank = MENU_GROUPS.indexOf(group) * 100 + order
    ranked.push([rank, { name, title: spec.title, group, key, visibility, phase: spec.phase }])
  }
  return ranked.sort(([a], [b]) => a - b).map(([, entry]) => entry)
}

/** Üst rota zinciri (kendisi dahil, kökten yaprağa) — konum izi ara parçaları. */
export function routeTrail(name: RouteName): RouteName[] {
  const trail: RouteName[] = []
  let current: string | undefined = name
  while (isRouteName(current) && !trail.includes(current)) {
    trail.unshift(current)
    current = routeSpec(current).parent
  }
  return trail
}

/** Rotada etkin olan menü öğesinin anahtarı (alt rotalar üst öğeyi etkin yapar). */
export function activeMenuKey(name: RouteName): string | undefined {
  return routeTrail(name)
    .map((n) => routeSpec(n).menu?.key)
    .filter((key): key is string => key !== undefined)
    .at(-1)
}

// --- Konum üretme / süzgeç okuma -------------------------------------------------------------

const ID_VALUE = /^[A-Za-z0-9_-]{1,128}$/
const MONTH_VALUE = /^\d{4}-(0[1-9]|1[0-2])$/
const TEXT_MAX = 200

type Scalar = string | boolean

function isSortValue(fields: readonly string[], value: string): boolean {
  const [field, direction] = value.split(':')
  const known = field !== undefined && fields.includes(field)
  return known && (direction === 'artan' || direction === 'azalan')
}

const BOOL_VALUES: Readonly<Record<string, boolean>> = { '1': true, '0': false }

const decoders: { [K in ParamSpec['kind']]: (spec: never, value: string) => Scalar | undefined } = {
  id: (_spec, value) => (ID_VALUE.test(value) ? value : undefined),
  text: (_spec, value) => (value.trim() === '' ? undefined : value.slice(0, TEXT_MAX)),
  bool: (_spec, value) => BOOL_VALUES[value],
  month: (_spec, value) => (MONTH_VALUE.test(value) ? value : undefined),
  enum: (spec: { values: readonly string[] }, value) =>
    spec.values.includes(value) ? value : undefined,
  sort: (spec: { fields: readonly string[] }, value) =>
    isSortValue(spec.fields, value) ? value : undefined,
}

/** Tek değeri spesifikasyona göre okur; geçersizse `undefined` (sessizce düşer, URL elle bozulabilir). */
export function decodeParam(spec: ParamSpec, raw: unknown): Scalar | undefined {
  const value = Array.isArray(raw) ? (raw as unknown[]).find((v) => typeof v === 'string') : raw
  if (typeof value !== 'string' || value === '') return undefined
  const decode = decoders[spec.kind] as (spec: ParamSpec, value: string) => Scalar | undefined
  return decode(spec, value)
}

function encodeParam(spec: ParamSpec, value: Scalar): string {
  const encoded = spec.kind === 'bool' ? (value ? '1' : '0') : String(value)
  if (decodeParam(spec, encoded) === undefined) {
    throw new Error(`rota parametresi geçersiz: ${spec.kind} = "${encoded}"`)
  }
  return encoded
}

/** Sorgu dizgisinden tipli süzgeçler; bilinmeyen anahtar ve geçersiz değer düşer. */
export function parseRouteQuery<N extends RouteName>(
  name: N,
  query: Readonly<Record<string, unknown>>,
): RouteQuery<N> {
  const out: Record<string, Scalar> = {}
  for (const [key, spec] of Object.entries<ParamSpec>(routeSpec(name).query)) {
    const value = decodeParam(spec, query[key])
    if (value !== undefined) out[key] = value
  }
  return out as RouteQuery<N>
}

export interface CatalogLocation {
  name: RouteName
  params: Record<string, string>
  query: Record<string, string>
}

/**
 * Tipli gezinme hedefi (`router.push(routeLocation(...))`). Canlı olmayan rotaya bağlantı
 * üretilmez (tıklanabilir ama işlevsiz kontrol yok); geçersiz değer hatadır.
 */
export function routeLocation<N extends RouteName>(
  name: N,
  params: RouteParams<N>,
  query: RouteQuery<N> = {},
  phase: Phase = CURRENT_PHASE,
): CatalogLocation {
  if (visibilityOf(name, phase) !== 'canli') {
    throw new Error(`rota ${phase} fazında canlı değil: ${name}`)
  }
  const spec = routeSpec(name)
  const encode = (specs: Readonly<Record<string, ParamSpec>>, values: object) => {
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(values) as [string, Scalar | undefined][]) {
      const paramSpec = specs[key]
      if (!paramSpec) throw new Error(`rota ${name}: bilinmeyen parametre "${key}"`)
      if (value !== undefined) out[key] = encodeParam(paramSpec, value)
    }
    return out
  }
  const location = { name, params: encode(spec.params, params), query: encode(spec.query, query) }
  for (const key of Object.keys(spec.params)) {
    if (!(key in location.params)) throw new Error(`rota ${name}: "${key}" parametresi eksik`)
  }
  return location
}
