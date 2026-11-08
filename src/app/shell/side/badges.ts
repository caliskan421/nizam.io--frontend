/**
 * Kabuk sayaçları (E-00-14, E-00-15, E-00-38; 00-ortak `backend.md` §1, `mekanizma.md` §5).
 *
 *  - Görevler rozetleri yalnız menü öğesi CANLI iken (F1+) hesaplanır; F0'da öğe devre dışıdır
 *    ve `reportDashboard` çağrılmaz.
 *  - Admin merceği: `reportDashboard.overdue_tasks` / `pending_date_changes` (S2, yalnız
 *    `company_admin`; REPORTING-K01). Sayaç hatasında rozet gizlenir; 0'da gizli.
 *  - Koordinatör/Üye merceği: sayaç ucu yok → BE-003, sayı gösterilmez (ortak-kurallar §4).
 *  - Tarih talebi rozeti Üye merceğinde HER ZAMAN gizli (istemci-akislari §6; eksik değil, kural).
 *  - Bildirim sayacı hesap genelidir (S1): anahtar kapsamsız, kapsam değişince yeniden istenmez.
 *
 * Anahtarlar `shared/http/query-keys.ts`: `scoped(['report','dashboard'])` (kapsam değişince
 * düşer) ve hesap geneli `['notifications','unread-count']`.
 */
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { CURRENT_PHASE, type Phase, visibilityOf } from '@/app/routes.catalog'
import type { components } from '@/shared/api/schema'
import { designStub } from '@/shared/design-stub'
import { api, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { useSessionStore } from '@/shared/session/store'

import { injectScopeLifecycle } from './scope-key'

type DashboardReport = components['schemas']['DashboardReport']
export type DashboardCounts = Pick<DashboardReport, 'overdue_tasks' | 'pending_date_changes'>

export async function fetchDashboardCounts(): Promise<DashboardCounts> {
  return unwrap(api.GET('/v1/reports/dashboard'))
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const result = await unwrap(api.GET('/v1/notifications/unread-count'))
  return result.count
}

export interface TaskBadges {
  overdue: number | null
  pendingDates: number | null
}

function positive(value: number | undefined): number | null {
  return typeof value === 'number' && value > 0 ? value : null
}

export function useTaskBadges(
  phase: Phase = CURRENT_PHASE,
  fetcher: () => Promise<DashboardCounts> = fetchDashboardCounts,
) {
  const lifecycle = injectScopeLifecycle()
  const store = useScopeStore()
  const live = visibilityOf('work.tasks', phase) === 'canli'
  const adminView = computed(
    () =>
      live &&
      lifecycle.status.value === 'ready' &&
      store.lens === 'admin' &&
      store.programId !== null &&
      lifecycle.facts.value.companyAdmin,
  )
  const query = useQuery(
    computed(() => ({
      queryKey: queryKeys.report.dashboard(store.snapshot),
      queryFn: fetcher,
      enabled: adminView.value,
      staleTime: 30_000,
    })),
  )
  const counts = computed(() =>
    adminView.value && !query.isError.value ? (query.data.value ?? null) : null,
  )

  const badges = computed<TaskBadges>(() => {
    if (!live || store.lens === null) return { overdue: null, pendingDates: null }
    if (store.lens === 'admin') {
      return {
        overdue: positive(counts.value?.overdue_tasks),
        pendingDates: positive(counts.value?.pending_date_changes),
      }
    }
    return {
      overdue: designStub('BE-003', null),
      pendingDates: store.lens === 'coordinator' ? designStub('BE-003', null) : null,
    }
  })
  return { badges }
}

/** Kenar menüsünde ortak bildirim sayacı anahtarı (ortak-kurallar §6). */
export const UNREAD_NOTIFICATIONS_KEY = queryKeys.notifications.unreadCount()

/** Okunmamış bildirim sayısı (E-00-38; zil paneli F7'ye kadar devre dışı). Hata → `null`. */
export function useUnreadNotifications(
  fetcher: () => Promise<number> = fetchUnreadNotificationCount,
) {
  const session = useSessionStore()
  const query = useQuery({
    queryKey: UNREAD_NOTIFICATIONS_KEY,
    queryFn: fetcher,
    enabled: computed(() => session.isAuthenticated),
    staleTime: 30_000,
  })
  const count = computed<number | null>(() =>
    query.isError.value ? null : (query.data.value ?? null),
  )
  return { count }
}
