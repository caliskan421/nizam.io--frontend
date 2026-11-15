/**
 * Silinen kayıt süzgeçleri ve sunucu sorgusu (E-12-17…20; P43; BE-117). Arama, koordinatörlük,
 * silen, tarih aralığı ve sıralama SUNUCUDA çalışır (`q`, `department_id`, `deleted_by`,
 * `deleted_from`, `sort`/`order`); süzgeçler sorgu anahtarına girer, değişince imleç sıfırlanır
 * (yeni anahtar → ilk sayfa; eski imleç 422 alırdı). Satırları istemcide süzen kod yoktur.
 * URL durumu `tur`, `q`, `koordinatorluk`, `kayit`, `aralik`, `silen`; sıralama bellekte tutulur.
 */
import { dayKey, dayStartIso, shiftDay } from './format'
import {
  DEFAULT_RANGE,
  isDeletedRange,
  parseKind,
  supportsActorFilter,
  supportsDepartmentFilter,
  supportsRange,
  type DeletedKind,
  type DeletedRange,
} from './kinds'

export interface DeletedFilters {
  kind: DeletedKind
  q: string
  department: string | null
  range: DeletedRange
  actor: string | null
  selected: string | null
}

type Query = Record<string, unknown>

function text(query: Query, key: string): string {
  const value = query[key]
  const first = Array.isArray(value) ? value[0] : value
  return typeof first === 'string' ? first : ''
}

/**
 * URL sorgusu → ETKİN süzgeçler: türe uymayan süzgeç yok sayılır (ör. hesapta tarih aralığı,
 * görevde silen). Kayıtsız `tur` → Görev.
 */
export function parseFilters(query: Query): DeletedFilters {
  const kind = parseKind(text(query, 'tur'))
  const range = text(query, 'aralik')
  return {
    kind,
    q: text(query, 'q').trim(),
    department: supportsDepartmentFilter(kind) ? text(query, 'koordinatorluk') || null : null,
    range: supportsRange(kind) && isDeletedRange(range) ? range : DEFAULT_RANGE,
    actor: supportsActorFilter(kind) ? text(query, 'silen') || null : null,
    selected: text(query, 'kayit') || null,
  }
}

/** Süzgeçler → URL sorgusu (varsayılanlar yazılmaz). */
export function filtersToQuery(filters: DeletedFilters): Record<string, string> {
  const out: Record<string, string> = {}
  if (filters.kind !== 'gorev') out.tur = filters.kind
  if (filters.q) out.q = filters.q
  if (filters.department) out.koordinatorluk = filters.department
  if (filters.range !== DEFAULT_RANGE) out.aralik = filters.range
  if (filters.actor) out.silen = filters.actor
  if (filters.selected) out.kayit = filters.selected
  return out
}

/**
 * Tür değişimi (mekanizma §3): `kayit` ve `silen` temizlenir; `q` ve `aralik` korunur;
 * `koordinatorluk` yalnız desteklenen türde korunur.
 */
export function changeKind(filters: DeletedFilters, kind: DeletedKind): DeletedFilters {
  return {
    ...filters,
    kind,
    selected: null,
    actor: null,
    department: supportsDepartmentFilter(kind) ? filters.department : null,
    range: supportsRange(kind) ? filters.range : DEFAULT_RANGE,
  }
}

/** Satırları daraltan süzgeç var mı ("Filtreleri temizle", boş durum ayrımı). */
export function isFiltered(filters: DeletedFilters): boolean {
  return (
    filters.q !== '' ||
    filters.department !== null ||
    filters.actor !== null ||
    filters.range !== DEFAULT_RANGE
  )
}

/** Süzgeçleri temizler; tür ve seçili kayıt korunur. */
export function clearFilters(filters: DeletedFilters): DeletedFilters {
  return { ...filters, q: '', department: null, actor: null, range: DEFAULT_RANGE }
}

// --- Sıralama (E-12-31) -------------------------------------------------------------------

export type SortKey = 'deleted_at' | 'name'
export type SortOrder = 'asc' | 'desc'
export interface DeletedSort {
  key: SortKey
  order: SortOrder
}

/** Varsayılan sıra "en yeni silinen üstte" (sunucu parametresiz sırasıyla aynı). */
export const DEFAULT_SORT: DeletedSort = { key: 'deleted_at', order: 'desc' }

/** Bir eksenin ilk yönü: zaman azalan, ad artan (sunucu varsayılanı). */
export function firstOrder(key: SortKey): SortOrder {
  return key === 'deleted_at' ? 'desc' : 'asc'
}

/** Başlık tıklaması: etkin eksen yön çevirir, başka eksen kendi ilk yönüyle açılır. */
export function toggleSort(current: DeletedSort, key: SortKey): DeletedSort {
  if (current.key !== key) return { key, order: firstOrder(key) }
  return { key, order: current.order === 'desc' ? 'asc' : 'desc' }
}

// --- Sunucu sorgusu -----------------------------------------------------------------------

/** Silinen listelerinin ortak süzgeç/sıra parametreleri (yalnız dolu olanlar yazılır). */
export interface ListQuery {
  q?: string
  sort?: SortKey
  order?: SortOrder
  deleted_from?: string
  deleted_by?: string
  department_id?: string
}

export interface RangeContext {
  now: Date
  timezone: string
}

/**
 * Aralığın alt sınırı: kurulum saat diliminde takvim gününün başladığı an (RFC 3339). "Bugün" =
 * bugünün günü, "Son 7 gün" = bugün ve önceki 6 gün. "Tümü" → `undefined`. Sınır gün anahtarından
 * türer: saat ilerlese de sorgu anahtarı gün içinde değişmez (yeniden istek döngüsü yok).
 */
export function rangeFrom(range: DeletedRange, ctx: RangeContext): string | undefined {
  const today = dayKey(ctx.now, ctx.timezone)
  if (range === 'tumu' || today === null) return undefined
  return dayStartIso(range === 'bugun' ? today : shiftDay(today, 6), ctx.timezone)
}

/**
 * Süzgeç + sıra → sunucu parametreleri. Süzgeç türe uymuyorsa gönderilmez (`parseFilters` zaten
 * ayıklar; tür değişiminde de korunur).
 */
export function toListQuery(
  filters: DeletedFilters,
  sort: DeletedSort,
  ctx: RangeContext,
): ListQuery {
  const query: ListQuery = {}
  if (filters.q) query.q = filters.q
  if (supportsDepartmentFilter(filters.kind) && filters.department) {
    query.department_id = filters.department
  }
  if (supportsActorFilter(filters.kind) && filters.actor) query.deleted_by = filters.actor
  const from = supportsRange(filters.kind) ? rangeFrom(filters.range, ctx) : undefined
  if (from) query.deleted_from = from
  if (sort.key !== DEFAULT_SORT.key || sort.order !== DEFAULT_SORT.order) {
    query.sort = sort.key
    query.order = sort.order
  }
  return query
}
