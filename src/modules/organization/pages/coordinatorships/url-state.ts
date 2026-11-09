/**
 * 08 liste URL durumu (K10; 08 `mekanizma.md` §3). Ad ve değer kümeleri rota kataloğuyla
 * (`organization.coordinatorships.query`) aynıdır (`COORDINATORSHIPS_QUERY_KEYS`,
 * `COORDINATORSHIPS_VIEWS`, `COORDINATORSHIPS_SORT_FIELDS`).
 *
 *  - `gorunum`: yalnız `liste` ("Yapı" devre dışı, BE-016; E-08-12) — varsayılan, yazılmaz.
 *  - `q`: istemci araması (E-08-13).
 *  - `sirala`: `ad:artan` | `ad:azalan` (E-08-16); varsayılan `ad:artan` yazılmaz.
 *  - Geçersiz değer sessizce düşer; bilinmeyen anahtar yazılmaz.
 */
import { COORDINATORSHIPS_SORT_FIELDS } from '../../routes'

export type SortDirection = 'artan' | 'azalan'

export interface CoordsUrlState {
  search: string
  direction: SortDirection
}

export const DEFAULT_COORDS_STATE: CoordsUrlState = { search: '', direction: 'artan' }

const TEXT_MAX = 200

function first(raw: unknown): string | undefined {
  const value = Array.isArray(raw)
    ? (raw as unknown[]).find((v) => typeof v === 'string' && v !== '')
    : raw
  return typeof value === 'string' && value !== '' ? value : undefined
}

function directionValue(raw: unknown): SortDirection {
  const [field, direction] = (first(raw) ?? '').split(':')
  const known = (COORDINATORSHIPS_SORT_FIELDS as readonly string[]).includes(field ?? '')
  return known && direction === 'azalan' ? 'azalan' : 'artan'
}

/** Sorgu dizgisinden tipli durum. */
export function parseCoordsQuery(query: Readonly<Record<string, unknown>>): CoordsUrlState {
  const search = first(query.q)
  return {
    search: search === undefined || search.trim() === '' ? '' : search.slice(0, TEXT_MAX),
    direction: directionValue(query.sirala),
  }
}

/** Tipli durumdan sorgu dizgisi; varsayılanlar yazılmaz. */
export function coordsQuery(state: CoordsUrlState): Record<string, string> {
  const query: Record<string, string> = {}
  const search = state.search.trim() === '' ? '' : state.search.slice(0, TEXT_MAX)
  if (search) query.q = search
  if (state.direction === 'azalan') query.sirala = 'ad:azalan'
  return query
}
