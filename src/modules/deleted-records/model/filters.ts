/**
 * İstemci süzgeçleri (E-12-17…20; P43). Sunucuda `sort`/`q`/süzgeç YOKTUR (BE-117): arama,
 * koordinatörlük, tarih aralığı ve silen YÜKLENEN KÜME üzerinde çalışır; sorgu anahtarına girmez.
 * URL durumu `tur`, `q`, `koordinatorluk`, `kayit`, `aralik`, `silen`.
 */
import { dayKey, shiftDay } from './format'
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
import { fold } from './rows'
import type { DeletedRow } from './types'

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
 * `koordinatorluk` yalnız Görev/Toplantı'da anlamlıdır (diğerine geçişte temizlenir).
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

export interface RangeContext {
  now: Date
  timezone: string
}

/**
 * Aralığın alt sınırı: kurulum saat diliminde takvim günü anahtarı. "Bugün" = bugünün günü,
 * "Son 7 gün" = bugün ve önceki 6 gün. "Tümü" → `null`.
 */
export function rangeFloor(range: DeletedRange, ctx: RangeContext): string | null {
  const today = dayKey(ctx.now, ctx.timezone)
  if (range === 'tumu' || today === null) return null
  return range === 'bugun' ? today : shiftDay(today, 6)
}

/** Silen adayları: yüklenen kümedeki tekil `deleted_by` (`null` silen "Bilinmiyor" adayıdır). */
export function actorCandidates(
  rows: readonly DeletedRow[],
): Array<{ accountId: string | null; name: string }> {
  const seen = new Map<string, { accountId: string | null; name: string }>()
  for (const row of rows) {
    if (!row.actor) continue
    const id = row.actor.accountId ?? ''
    if (!seen.has(id)) seen.set(id, row.actor)
  }
  return [...seen.values()]
}

/** URL `silen` değeri: bilinmeyen silen için sabit işaret (hesap kimliği olamaz). */
export const UNKNOWN_ACTOR = '_bilinmiyor'

export function actorValue(actor: { accountId: string | null }): string {
  return actor.accountId ?? UNKNOWN_ACTOR
}

/** Koordinatörlük adayları: yüklenen kümedeki satırların kimlikleri (ad çağıranda çözülür). */
export function departmentCandidates(rows: readonly DeletedRow[]): string[] {
  return [...new Set(rows.flatMap((row) => row.departmentIds))]
}

export function applyFilters(
  rows: readonly DeletedRow[],
  filters: DeletedFilters,
  ctx: RangeContext,
): DeletedRow[] {
  const needle = filters.q ? fold(filters.q) : ''
  const floor = rangeFloor(filters.range, ctx)
  return rows.filter((row) => {
    if (needle && !row.searchText.includes(needle)) return false
    if (filters.department && !row.departmentIds.includes(filters.department)) return false
    if (filters.actor && actorValue(row.actor ?? { accountId: null }) !== filters.actor) {
      return false
    }
    if (floor !== null) {
      const day = dayKey(row.deletedAt, ctx.timezone)
      // Tarihi bilinmeyen satır aralığın içinde olduğu kanıtlanamaz: aralık seçiliyken düşer.
      if (day === null || day < floor) return false
    }
    return true
  })
}

/**
 * Aralık için daha sayfa yüklenmeli mi: sıra `deleted_at DESC` olduğundan, aralığın alt sınırından
 * eski bir satır görünene ya da imleç bitene kadar sayfa yüklenir (aynı uç; fan-out değil).
 */
export function rangeNeedsMore(
  rows: readonly DeletedRow[],
  filters: DeletedFilters,
  hasMore: boolean,
  ctx: RangeContext,
): boolean {
  const floor = rangeFloor(filters.range, ctx)
  if (floor === null || !hasMore) return false
  const days = rows
    .map((row) => dayKey(row.deletedAt, ctx.timezone))
    .filter((day): day is string => day !== null)
  if (days.length === 0) return true
  // En eski yüklenen gün hâlâ aralık içindeyse sınır aşılmadı.
  return days.reduce((a, b) => (a < b ? a : b)) >= floor
}

/** Sayaç etiketi: imleç bitmediyse "n+" (yaklaşık, yüklenen küme), bitince kesin. */
export function countLabel(loaded: number, hasMore: boolean): string {
  return hasMore ? `${loaded}+` : String(loaded)
}
