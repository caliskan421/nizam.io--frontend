/**
 * Görev listesinin URL durumu (K10; 03 `mekanizma.md` §3, README satır dışı varsayımlar).
 * Ad ve değer kümeleri rota kataloğuyla (`work.tasks.query`) aynıdır; modül kataloğu içe
 * aktaramadığı için okuma/yazma burada, eşitlik `app/routes.catalog.test.ts`'te denetlenir.
 *
 *  - `durum`: sekme (yoksa "Tümü"), `talep`: tarih talebi süzgeci (`1`), `q`: arama,
 *    `koordinatorluk`: tek departman (yalnız Admin merceğinde anlamlı, K3), `sirala`:
 *    `alan:yön` (yoksa sunucu sırası), `gorev`: açık panel.
 *  - `kisi` F1'de yok (E-03-11 statik, BE-038); imleç ve panel sekmesi URL'de taşınmaz.
 *  - Geçersiz değer sessizce düşer (URL elle bozulabilir); bilinmeyen anahtar yazılmaz.
 */
import { TASKS_SORT_FIELDS, TASKS_STATUS_FILTERS } from '../../routes'

export type StatusFilter = (typeof TASKS_STATUS_FILTERS)[number]
/** Sekme: "Tümü" + `durum` değerleri. */
export type TaskTab = 'tumu' | StatusFilter
export type SortField = (typeof TASKS_SORT_FIELDS)[number]
export type SortDirection = 'artan' | 'azalan'

export interface TaskSort {
  field: SortField
  direction: SortDirection
}

export interface TasksUrlState {
  tab: TaskTab
  requests: boolean
  search: string
  department: string | null
  sort: TaskSort | null
  open: string | null
}

export const DEFAULT_TASKS_STATE: TasksUrlState = {
  tab: 'tumu',
  requests: false,
  search: '',
  department: null,
  sort: null,
  open: null,
}

const ID_VALUE = /^[A-Za-z0-9_-]{1,128}$/
const TEXT_MAX = 200

function first(raw: unknown): string | undefined {
  const value = Array.isArray(raw) ? (raw as unknown[]).find((v) => typeof v === 'string') : raw
  return typeof value === 'string' && value !== '' ? value : undefined
}

function idValue(raw: unknown): string | null {
  const value = first(raw)
  return value !== undefined && ID_VALUE.test(value) ? value : null
}

function tabValue(raw: unknown): TaskTab {
  const value = first(raw)
  return (TASKS_STATUS_FILTERS as readonly string[]).includes(value ?? '')
    ? (value as StatusFilter)
    : 'tumu'
}

function sortValue(raw: unknown): TaskSort | null {
  const [field, direction] = (first(raw) ?? '').split(':')
  const known = (TASKS_SORT_FIELDS as readonly string[]).includes(field ?? '')
  if (!known || (direction !== 'artan' && direction !== 'azalan')) return null
  return { field: field as SortField, direction }
}

function textValue(raw: unknown): string {
  const value = first(raw)
  return value === undefined || value.trim() === '' ? '' : value.slice(0, TEXT_MAX)
}

/** Sorgu dizgisinden tipli durum. */
export function parseTasksQuery(query: Readonly<Record<string, unknown>>): TasksUrlState {
  return {
    tab: tabValue(query.durum),
    requests: first(query.talep) === '1',
    search: textValue(query.q),
    department: idValue(query.koordinatorluk),
    sort: sortValue(query.sirala),
    open: idValue(query.gorev),
  }
}

/** Tipli durumdan sorgu dizgisi; varsayılan değerler yazılmaz. */
export function tasksQuery(state: TasksUrlState): Record<string, string> {
  const query: Record<string, string> = {}
  if (state.tab !== 'tumu') query.durum = state.tab
  if (state.requests) query.talep = '1'
  const search = state.search.trim() === '' ? '' : state.search.slice(0, TEXT_MAX)
  if (search) query.q = search
  if (state.department && ID_VALUE.test(state.department)) query.koordinatorluk = state.department
  if (state.sort) query.sirala = `${state.sort.field}:${state.sort.direction}`
  if (state.open && ID_VALUE.test(state.open)) query.gorev = state.open
  return query
}

/** Sütun başına döngü (koordinatör kararı): artan → azalan → varsayılan (sunucu sırası). */
export function nextSort(current: TaskSort | null, field: SortField): TaskSort | null {
  if (current?.field !== field) return { field, direction: 'artan' }
  return current.direction === 'artan' ? { field, direction: 'azalan' } : null
}

/** "Süzgeçleri temizle": sekme, talep, arama ve koordinatörlük sıfırlanır; sıralama/panel kalır. */
export function clearedFilters(state: TasksUrlState): TasksUrlState {
  return { ...state, tab: 'tumu', requests: false, search: '', department: null }
}

/** İstemci süzgeci etkin mi (boş sonuç "süzgeç sonucu boş" mu, "liste boş" mu). */
export function hasActiveFilters(state: TasksUrlState): boolean {
  return state.tab !== 'tumu' || state.requests || state.search !== '' || state.department !== null
}
