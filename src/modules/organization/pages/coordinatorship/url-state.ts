/**
 * 08b URL durumu (E-08-57; katalog `organization.coordinatorship`): `departmentId` yol
 * parametresi, `sekme` sorgu parametresi (`genel` | `uyeler` | `gorevler` | `ayarlar`; Arşiv F5 ve
 * Toplantılar F4 devre dışı → URL'de seçilemez). Bilinmeyen/boş değer varsayılana (`genel`)
 * düşer; varsayılan sekme URL'ye yazılmaz.
 */
import type { LocationQuery } from 'vue-router'

import type { CoordinatorshipTab } from '../../components/index'
import { COORDINATORSHIP_TABS } from '../../routes'

export const DEFAULT_TAB: CoordinatorshipTab = 'genel'

function first(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw : null
}

export function tabFromQuery(query: Readonly<Record<string, unknown>>): CoordinatorshipTab {
  const raw = first(query.sekme)
  return (COORDINATORSHIP_TABS as readonly string[]).includes(raw ?? '')
    ? (raw as CoordinatorshipTab)
    : DEFAULT_TAB
}

/** Sekme değişiminden sonraki sorgu: diğer anahtarlar korunur, varsayılan sekme yazılmaz. */
export function queryWithTab(query: LocationQuery, tab: CoordinatorshipTab): LocationQuery {
  const next: LocationQuery = { ...query }
  if (tab === DEFAULT_TAB) delete next.sekme
  else next.sekme = tab
  return next
}

export function departmentFromParams(params: Readonly<Record<string, unknown>>): string {
  return first(params.departmentId) ?? ''
}
