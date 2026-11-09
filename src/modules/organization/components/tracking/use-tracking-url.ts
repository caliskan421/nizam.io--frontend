/**
 * 05b URL durumu (K10; katalog `organization.user.query`): `sekme`, `kart`, `grupla`, `ay`.
 * Varsayılanlar URL'ye yazılmaz (`gorevler`, `acik`, `son-tarih`, bugünün ayı); geçersiz değer
 * varsayılana düşer. Değişim geçmişe kayıt eklemez (`replace`). Kapsam değişiminde bu ekranın
 * süzgeçleri korunur (kişi S1 kimliğidir; görev kümesi yeni programın anahtarıyla yeniden okunur).
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'

import { USER_CARDS, USER_GROUPINGS, USER_ROUTE, USER_TABS } from '../../routes'
import { isMonth, type TrackingCard, type TrackingGrouping } from './model'

export type TrackingTab = (typeof USER_TABS)[number]

export interface TrackingUrlState {
  tab: TrackingTab
  card: TrackingCard
  grouping: TrackingGrouping
  /** `YYYY-MM`; `null` = bugünün ayı. */
  month: string | null
}

export const TRACKING_DEFAULTS: TrackingUrlState = {
  tab: 'gorevler',
  card: 'acik',
  grouping: 'son-tarih',
  month: null,
}

function pick<V extends string>(values: readonly V[], raw: unknown, fallback: V): V {
  return typeof raw === 'string' && (values as readonly string[]).includes(raw)
    ? (raw as V)
    : fallback
}

export function parseTrackingQuery(query: LocationQuery): TrackingUrlState {
  return {
    tab: pick(USER_TABS, query.sekme, TRACKING_DEFAULTS.tab),
    card: pick(USER_CARDS, query.kart, TRACKING_DEFAULTS.card),
    grouping: pick(USER_GROUPINGS, query.grupla, TRACKING_DEFAULTS.grouping),
    month: isMonth(query.ay) ? query.ay : null,
  }
}

/** Durum → sorgu dizgisi (varsayılanlar yazılmaz). */
export function trackingQuery(state: TrackingUrlState): Record<string, string> {
  const query: Record<string, string> = {}
  if (state.tab !== TRACKING_DEFAULTS.tab) query.sekme = state.tab
  if (state.card !== TRACKING_DEFAULTS.card) query.kart = state.card
  if (state.grouping !== TRACKING_DEFAULTS.grouping) query.grupla = state.grouping
  if (state.month !== null) query.ay = state.month
  return query
}

export function useTrackingUrl(accountId: MaybeRefOrGetter<string>) {
  const route = useRoute()
  const router = useRouter()
  const state = computed(() => parseTrackingQuery(route.query))

  function update(patch: Partial<TrackingUrlState>) {
    return router.replace({
      name: USER_ROUTE.name,
      params: { accountId: toValue(accountId) },
      query: trackingQuery({ ...state.value, ...patch }),
    })
  }

  return { state, update }
}
