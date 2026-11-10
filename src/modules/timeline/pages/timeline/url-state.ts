/**
 * Zaman çizelgesi URL durumu (K10, 03c README rota satırı): `durum`, `departman` (Admin
 * yüzünde TEK departman), `olcek`, `secili` (görev kimliği), `altgorev` (yalnız `kapali`
 * canlı). Varsayılan değerler URL'ye yazılmaz. Bilinmeyen değer varsayılana düşer (rota
 * kataloğu zaten geçersizi eler; burası ikinci savunma). Süzgeç değişimi `replace`, seçim
 * `push` (geri tuşu paneli kapatır).
 */
import type { GanttScale, GanttStatusFilter } from '../../components'
import { SCALES, STATUS_FILTERS } from './frame-model'

export type SubtaskMode = 'kapali' | 'tumu'

export interface TimelineUrlState {
  status: GanttStatusFilter
  department: string | null
  scale: GanttScale
  selected: string | null
  subtasks: SubtaskMode
}

export const DEFAULT_SCALE: GanttScale = 'hafta'
export const DEFAULT_STATUS: GanttStatusFilter = 'tumu'

const ID_VALUE = /^[A-Za-z0-9_-]{1,128}$/

function first(raw: unknown): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' ? value : null
}

function oneOf<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  const value = first(raw)
  return allowed.includes(value as T) ? (value as T) : fallback
}

function idOf(raw: unknown): string | null {
  const value = first(raw)
  return value !== null && ID_VALUE.test(value) ? value : null
}

export function parseTimelineQuery(query: Readonly<Record<string, unknown>>): TimelineUrlState {
  return {
    status: oneOf(query.durum, STATUS_FILTERS, DEFAULT_STATUS),
    department: idOf(query.departman),
    scale: oneOf(query.olcek, SCALES, DEFAULT_SCALE),
    selected: idOf(query.secili),
    // "Tümünü aç" devre dışı (K3, E-03C-13): `tumu` değeri okunur ama canlı davranış `kapali`.
    subtasks: oneOf(query.altgorev, ['kapali', 'tumu'] as const, 'kapali'),
  }
}

/** Durumdan URL sorgusu (varsayılanlar yazılmaz). */
export function timelineQuery(state: TimelineUrlState): Record<string, string> {
  const query: Record<string, string> = {}
  if (state.status !== DEFAULT_STATUS) query.durum = state.status
  if (state.department !== null) query.departman = state.department
  if (state.scale !== DEFAULT_SCALE) query.olcek = state.scale
  if (state.selected !== null) query.secili = state.selected
  if (state.subtasks !== 'kapali') query.altgorev = state.subtasks
  return query
}

/** Etkin süzgeç var mı (boş sonuçta "süzgeçleri temizle" önerisi). */
export function hasActiveFilters(state: TimelineUrlState): boolean {
  return state.status !== DEFAULT_STATUS || state.department !== null
}

export function clearedFilters(state: TimelineUrlState): Partial<TimelineUrlState> {
  return { status: DEFAULT_STATUS, department: null, selected: state.selected }
}
