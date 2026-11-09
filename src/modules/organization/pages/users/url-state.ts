/**
 * 05 Kullanıcılar URL durumu (K10; README rota satırı). Ad ve değer kümeleri rota kataloğuyla
 * (`users.query`) aynıdır: `rol` (sekme; yoksa "Tümü"), `q` (arama), `koordinatorluk`
 * (tek birim), `secili` (yan panel). İmleç/sayfa URL'de taşınmaz (P4). Geçersiz değer sessizce
 * düşer; bilinmeyen anahtar yazılmaz.
 */
import { USER_ROLE_TABS, type UserRoleTab } from '../../model/capabilities'

export interface UsersUrlState {
  tab: UserRoleTab
  search: string
  department: string | null
  selected: string | null
}

export const DEFAULT_USERS_STATE: UsersUrlState = {
  tab: 'tumu',
  search: '',
  department: null,
  selected: null,
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

function tabValue(raw: unknown): UserRoleTab {
  const value = first(raw)
  return USER_ROLE_TABS.find((tab) => tab === value) ?? 'tumu'
}

function textValue(raw: unknown): string {
  const value = first(raw)
  return value === undefined || value.trim() === '' ? '' : value.slice(0, TEXT_MAX)
}

/** Sorgu dizgisinden tipli durum. */
export function parseUsersQuery(query: Readonly<Record<string, unknown>>): UsersUrlState {
  return {
    tab: tabValue(query.rol),
    search: textValue(query.q),
    department: idValue(query.koordinatorluk),
    selected: idValue(query.secili),
  }
}

/** Tipli durumdan sorgu dizgisi (varsayılanlar yazılmaz). */
export function usersQuery(state: UsersUrlState): Record<string, string> {
  const query: Record<string, string> = {}
  if (state.tab !== 'tumu') query.rol = state.tab
  if (state.search.trim() !== '') query.q = state.search
  if (state.department) query.koordinatorluk = state.department
  if (state.selected) query.secili = state.selected
  return query
}
