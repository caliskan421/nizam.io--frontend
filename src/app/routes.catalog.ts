// Rota kataloğu (yol haritası K10) — router'ın, kenar menüsünün, konum izinin ve F46 asistan
// görünüm kataloğunun TEK kaynağı: tipli ad → yol → tipli parametre/süzgeç, menü grubu, faz
// görünürlüğü (ortak-kurallar §5). URL özelliğe göredir; rol öneki yok (lint + test).
//
// Kurallar:
// - Yalnız v1 (F0–F4) ekranları; v1 dışı modüller (Arşiv F5, Mesajlar F7, İşlem geçmişi, Tablolar,
//   Takvim, Kurumsal hafıza, Simülasyon) ve hedefi tanımsız öğeler (Yardım, Asistan) katalogda
//   YOKTUR. "Teknofest ve sezon" (E-00-25) F2'de program yönetimi rotasıdır (W81, P3).
//   F6 (W136): iki rapor önizleme rotası (01f/01g; yalnız şirket yöneticisi) katalogdadır, menüsüz;
//   `CURRENT_PHASE` F6'da canlıdır (router'a girerler; kapı `modules/reports/routing/ReportsGate`).
//   F5 (W121): Arşiv (06/07) katalogdadır; "Silinen kayıtlar" (12, W128) katalogdadır ama menüye
//   GİRMEZ (P36: giriş ana sayfa E-01-02 düğmesi).
// - Router yalnız `CURRENT_PHASE`'te `canli` olan rotaları kaydeder; diğerleri bilinmeyen yol gibi
//   davranır. Menü `gizli` öğeyi göstermez, `devre_disi` öğeyi faz notuyla tıklanamaz gösterir.
// - Kapsam (program/departman/mercek) URL'ye yazılmaz (K2; 00-ortak kabul E-00-04).
// - Parametre ve süzgeç adları grup README "Rota (önerilen, K10)" satırlarından; katalog son
//   sözü söyler (ad uyumu, rol değeri taşıyan süzgeçlerin dışarıda bırakılması — bkz. girdiler).
import { ARCHIVE_TAGS, ARCHIVE_KINDS } from '@/modules/archive/public'
import { DELETED_KINDS, DELETED_RANGES } from '@/modules/deleted-records/public'
import { USER_ROLE_TABS } from '@/modules/organization/public'
import type { ScopeClass } from '@/shared/scope/scope-class'

export const PHASES = ['F0', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6'] as const
export type Phase = (typeof PHASES)[number]

/** Etkin faz. Faz açılışında tek satır değişir; görünürlük matrisi buradan türetilir. */
export const CURRENT_PHASE: Phase = 'F6'

export type Visibility = 'canli' | 'gizli' | 'devre_disi'
export type MenuGroup = 'takip' | 'icerik' | 'yonetim'
export const MENU_GROUPS: readonly MenuGroup[] = ['takip', 'icerik', 'yonetim']

// --- Parametre / süzgeç tipleri -------------------------------------------------------------

export type SortDirection = 'artan' | 'azalan'

export type ParamSpec =
  | { readonly kind: 'id' }
  | { readonly kind: 'ids' }
  | { readonly kind: 'text' }
  | { readonly kind: 'bool' }
  | { readonly kind: 'month' }
  | { readonly kind: 'enum'; readonly values: readonly string[] }
  | { readonly kind: 'sort'; readonly fields: readonly string[] }

const id = { kind: 'id' } as const
const ids = { kind: 'ids' } as const
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
    // Sayfa `modules/home` (01 sade, W51): S2 uçlarını (pano / görev listesi) sayfa içinden
    // yalnız kapsam tamken okur; rota kapsamı S1 kalır (kapsam kabukta seçilir; K7 açık durumlar
    // kabukta, kapsam eksikken KPI bölgesinde seçim notu).
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
    // `next`: kapının yönlendirdiği uygulama içi yol (geldiği rota); başarılı girişte oraya
    // `replace` ile dönülür (W145 KUSUR 1; doğrulama `session-next.ts`, dış/mutlak URL reddedilir).
    query: { next: text },
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
    // 03 README satır dışı varsayımlar (kabul): `kisi` virgülle ayrılmış atanan kimlikleri
    // (E-03-11, BE-038; sunucu `assignee_account_id`, en çok 50); sayfa/imleç URL'de taşınmaz (E-03-39); panel sekmesi bellekte (E-03-45). `durum`: beş
    // durum (P5) + türetilmiş "Geciken" sekmesi (`is_overdue`; E-03-07); "Tümü" parametresiz.
    query: {
      durum: oneOf([
        'baslanmadi',
        'devam_ediyor',
        'onaya_sunuldu',
        'iade_edildi',
        'tamamlandi',
        'geciken',
      ]),
      talep: bool,
      q: text,
      koordinatorluk: id,
      kisi: ids,
      sirala: sortBy(['gorev', 'durum', 'bitis']),
      gorev: id,
      // "Yeni görev" girişi (E-03-06; 01 hızlı işlemi, W48): formu açar, sayfa okuyunca düşer.
      yeni: bool,
      // Yeni görev formunda ön atanan (E-05-48 "Görev ata", W76): yalnız `yeni` ile anlamlı,
      // formun birimindeki ekipte değilse yok sayılır; `yeni` ile birlikte URL'den düşer.
      atanan: id,
    },
  },
  'work.timeline': {
    path: '/zaman-cizelgesi',
    title: 'Zaman çizelgesi',
    scope: 'S2',
    phase: 'F3',
    // ortak-kurallar §5: F3'te menü "Zaman çizelgesi" canlı (önceki fazlarda gizli).
    menu: { group: 'takip', key: 'gantt', order: 3 },
    parent: 'work.tasks',
    params: {},
    // 03c README rota satırı (W91, F3 geçişi): `departman` Admin yüzünde TEK departman süzgeci
    // (E-03C-05, K3; çoklu seçim yok — BE-058 koşullu) ve 08 E-08-86 kısayolu; Koordinatör/Üye
    // yüzünde birim kenar menüsünden seçilir. `altgorev` yalnız `kapali` canlıdır ("Tümünü aç"
    // devre dışı, K3/E-03C-13) ama değer kümesi tablodaki gibi `tumu`yu da tanır.
    query: {
      durum: oneOf(['tumu', 'acik', 'geciken', 'biten']),
      departman: id,
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
    // 05 README rota satırı (W71, F2 geçişi): `rol` sekmesi (E-05-06) — değer kümesi organizasyon
    // capability dosyasından (rol dizesi yalnız orada, K1 lint); `sayfa` yok (imleç URL'de
    // taşınmaz, P4/E-05-23).
    query: { rol: oneOf(USER_ROLE_TABS), q: text, koordinatorluk: id, secili: id },
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
    // 08 kabul (W71): `gorunum` yalnız `liste` ("Yapı" devre dışı, BE-016; E-08-12); `sirala`
    // yalnız ada göre + yön (E-08-16, `Intl.Collator('tr')`).
    query: { gorunum: oneOf(['liste']), q: text, sirala: sortBy(['ad']) },
  },
  'organization.coordinatorship': {
    path: '/koordinatorlukler/:departmentId',
    title: 'Koordinatörlük',
    scope: 'S2',
    phase: 'F2',
    parent: 'organization.coordinatorships',
    params: { departmentId: id },
    // E-08-57: Arşiv (F5) ve Toplantılar (F4) sekmeleri devre dışı → URL'de seçilemez.
    query: { sekme: oneOf(['genel', 'uyeler', 'gorevler', 'ayarlar']) },
  },
  'program.programs': {
    path: '/programlar',
    title: 'Teknofest ve sezon',
    // E-00-25 (W81): tuvalde artboard yok → P3 minimum; yalnız `company_admin` (P1). Program uçları
    // S1; seçili programa bağlı bölümler sayfa içinde kapsam hazırken çizilir.
    scope: 'S1',
    phase: 'F2',
    menu: { group: 'yonetim', key: 'season', order: 3 },
    params: {},
    query: {},
  },
  'collaboration.meetings': {
    path: '/toplantilar',
    title: 'Toplantılar',
    scope: 'S2',
    phase: 'F4',
    menu: { group: 'icerik', key: 'meetings', order: 1 },
    params: {},
    query: {
      zaman: oneOf(['yaklasan', 'gecmis', 'silinenler']),
      koordinatorluk: id,
      from: text,
      to: text,
    },
  },
  'collaboration.meeting': {
    path: '/toplantilar/:meetingId',
    title: 'Toplantı',
    scope: 'S2',
    phase: 'F4',
    parent: 'collaboration.meetings',
    params: { meetingId: id },
    query: {
      notlar: oneOf(['tumu', 'gorev', 'benim']),
      zaman: oneOf(['yaklasan', 'gecmis', 'silinenler']),
      koordinatorluk: id,
      from: text,
      to: text,
    },
  },
  'archive.folders': {
    path: '/arsiv',
    title: 'Arşiv',
    // Arşiv uçlarının hepsi S3'tür; yöneticide departman başlığı yalnız rotadaki klasörden gelir
    // (P33, `modules/archive/model/admin-scope.ts`), koordinatör/üye 06'yı atlar (P40).
    scope: 'S3',
    phase: 'F5',
    // Sidebar.dc.html: İçerik grubunda Toplantılar'dan sonra (K/Ü varyantı); Kurumsal hafıza yok.
    menu: { group: 'icerik', key: 'archive', order: 2 },
    params: {},
    // 06 README rota satırı: `tur` yalnız gönderilebilen değerler (PDF ayrı kategori değil,
    // E-06-07); `sirala` yalnız ad/dosya sayısı (Son yükleme için alan yok, BE-025).
    query: { q: text, tur: oneOf(ARCHIVE_KINDS), sirala: sortBy(['ad', 'dosya']) },
  },
  'archive.folder': {
    path: '/arsiv/:klasorId',
    title: 'Klasör',
    scope: 'S3',
    phase: 'F5',
    parent: 'archive.folders',
    params: { klasorId: id },
    // 07: `gorev` görev klasörü, `etiket` kapalı küme (P34), `gorunum` ızgara/liste, `dosya`
    // önizlenen dosya kimliği (paylaşılabilir, geri tuşu).
    query: {
      gorev: id,
      etiket: oneOf(ARCHIVE_TAGS),
      gorunum: oneOf(['izgara', 'liste']),
      dosya: id,
      q: text,
    },
  },
  'reports.season': {
    path: '/arsiv/donem-raporu',
    title: 'Dönem sonu raporu',
    // 01f önizleme (13 mekanizma §1): `reportSeason` S2; yalnız şirket yöneticisi (K/Ü → erişim
    // yok, `modules/reports/routing/ReportsGate`). Menüde YOK (E-13-76: `/raporlar` rotası yok);
    // giriş 06 Arşiv başlığındaki "Önizle" bağlantısıdır. Süzgeç yok (E-13-13).
    scope: 'S2',
    phase: 'F6',
    parent: 'archive.folders',
    params: {},
    query: {},
  },
  'reports.meeting': {
    path: '/toplantilar/:meetingId/rapor',
    title: 'Toplantı raporu',
    // 01g önizleme: `reportMeetingDetail` S2; yalnız şirket yöneticisi (K için 403,
    // REPORTING-K01). Rota parametresi tipli `meetingId` (09 ile aynı ad); menüsüz.
    scope: 'S2',
    phase: 'F6',
    parent: 'collaboration.meeting',
    params: { meetingId: id },
    query: {},
  },
  'deleted-records.list': {
    path: '/silinen-kayitlar',
    title: 'Silinen kayıtlar',
    // Görev, toplantı ve koordinatörlük uçları S2'dir (program başlığı); hesap ucu S1'dir ama
    // varsayılan sekme S2 olduğundan rota S2 sayılır (program yokken kabuğun "program yok"
    // durumu çizilir; W128 varsayımı). Menüde giriş YOK (P36): menu alanı bilinçli olarak yok.
    scope: 'S2',
    phase: 'F5',
    params: {},
    // 12 README rota satırı (P41–P43): devre dışı türler (altgorev, dosya, notgundem) URL değeri
    // olarak tanınmaz; `silen` yalnız toplantıda canlıdır, `aralik` hesapta yok sayılır.
    query: {
      tur: oneOf(DELETED_KINDS),
      q: text,
      koordinatorluk: id,
      kayit: id,
      aralik: oneOf(DELETED_RANGES),
      silen: id,
    },
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
/** `ids` değeri: virgülle ayrılmış kimlikler, en çok 50 (sunucu atanan süzgeci sınırı). */
const IDS_MAX = 50

type Scalar = string | boolean

function isSortValue(fields: readonly string[], value: string): boolean {
  const [field, direction] = value.split(':')
  const known = field !== undefined && fields.includes(field)
  return known && (direction === 'artan' || direction === 'azalan')
}

const BOOL_VALUES: Readonly<Record<string, boolean>> = { '1': true, '0': false }

const decoders: { [K in ParamSpec['kind']]: (spec: never, value: string) => Scalar | undefined } = {
  id: (_spec, value) => (ID_VALUE.test(value) ? value : undefined),
  ids: (_spec, value) => {
    const parts = value.split(',')
    return parts.length <= IDS_MAX && parts.every((part) => ID_VALUE.test(part)) ? value : undefined
  },
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
