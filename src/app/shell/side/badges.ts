/**
 * Kabuk sayaçları (E-00-14, E-00-15, E-00-38; 00-ortak `backend.md` §1, `mekanizma.md` §5).
 *
 *  - Görevler rozetleri yalnız menü öğesi CANLI iken (F1+) hesaplanır; F0'da öğe devre dışıdır
 *    ve sayaç uçları çağrılmaz.
 *  - Admin merceği: `reportDashboard.overdue_tasks` / `pending_date_changes` (S2, yalnız
 *    `company_admin`; REPORTING-K01). Sayaç hatasında rozet gizlenir; 0'da gizli.
 *  - Koordinatör/Üye merceği (BE-003, bağlandı): `countProgramWorkItems` (S2) — görev listesiyle
 *    aynı görünürlük ve süzgeç: seçili birim (`department_id`); Üye merceğinde ayrıca
 *    `assignee_account_id` = ben (K3: mercek içeriği daraltır, yetkiyi değil). `overdue` ve
 *    (yalnız Koordinatör) `pending_date_requests` rozete gider.
 *  - Tarih talebi rozeti Üye merceğinde HER ZAMAN gizli (istemci-akislari §6; eksik değil, kural).
 *  - Bildirim sayacı hesap genelidir (S1): anahtar kapsamsız, kapsam değişince yeniden istenmez.
 *
 * Anahtarlar `shared/http/query-keys.ts`: `scoped(['report','dashboard'])` (kapsam değişince
 * düşer) ve hesap geneli `['notifications','unread-count']`.
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed } from 'vue'

import { CURRENT_PHASE, type Phase, visibilityOf } from '@/app/routes.catalog'
import type { components } from '@/shared/api/schema'
import { api, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'
import { useSessionStore } from '@/shared/session/store'

import { injectScopeLifecycle } from './scope-key'

type DashboardReport = components['schemas']['DashboardReport']
export type DashboardCounts = Pick<DashboardReport, 'overdue_tasks' | 'pending_date_changes'>

export async function fetchDashboardCounts(signal?: AbortSignal): Promise<DashboardCounts> {
  return unwrap(api.GET('/v1/reports/dashboard', { signal }))
}

export async function fetchUnreadNotificationCount(signal?: AbortSignal): Promise<number> {
  const result = await unwrap(api.GET('/v1/notifications/unread-count', { signal }))
  return result.count
}

export type ShellWorkCounts = Pick<
  components['schemas']['ProgramWorkItemCounts'],
  'overdue' | 'pending_date_requests'
>

/** K/Ü rozet sayacı süzgeçleri; liste ile aynı kurallar (`countProgramWorkItems`). */
export interface ShellCountsRequest {
  programId: string
  departmentId: string
  /** Üye merceğinde "ben"; Koordinatörde `null` (atanan süzgeci yok). */
  assigneeAccountId: string | null
}

export async function fetchShellWorkCounts(
  request: ShellCountsRequest,
  signal?: AbortSignal,
): Promise<ShellWorkCounts> {
  return unwrap(
    api.GET('/v1/program/work-items/counts', {
      params: {
        header: { 'X-Nizamio-Program': request.programId },
        query: {
          department_id: request.departmentId,
          ...(request.assigneeAccountId
            ? { assignee_account_id: [request.assigneeAccountId] }
            : {}),
        },
      },
      signal,
    }),
  )
}

export interface TaskBadges {
  overdue: number | null
  pendingDates: number | null
}

function positive(value: number | undefined): number | null {
  return typeof value === 'number' && value > 0 ? value : null
}

/**
 * K/Ü merceği: seçili birimin sayaçları (Üye: yalnız bana atananlar). Eksik kimlik/birimde istek
 * yok; mercek ≠ yetki, yetkisiz kapsamı sunucu redleri belirler (403/404 → rozet gizli).
 */
function useLensCounts(
  live: boolean,
  countsFetcher: (request: ShellCountsRequest, signal?: AbortSignal) => Promise<ShellWorkCounts>,
) {
  const lifecycle = injectScopeLifecycle()
  const store = useScopeStore()
  const requestOf = computed<ShellCountsRequest | null>(() => {
    const lens = store.lens
    const programId = store.programId
    const departmentId = store.departmentId
    if (!live || lifecycle.status.value !== 'ready') return null
    if ((lens !== 'coordinator' && lens !== 'member') || !programId || !departmentId) return null
    const accountId = lifecycle.standing.value?.accountId ?? null
    if (lens === 'member' && accountId === null) return null
    return { programId, departmentId, assigneeAccountId: lens === 'member' ? accountId : null }
  })
  const lensQuery = useQuery(
    computed(() => {
      const request = requestOf.value
      return {
        queryKey: queryKeys.shellBadges.counts(store.snapshot, {
          departmentId: request?.departmentId ?? null,
          assignee: request?.assigneeAccountId ?? null,
        }),
        // Okuyucu kapısı (CX-F2-Ö-01) + iptal sinyali.
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          countsFetcher(request as ShellCountsRequest, signal),
        ),
        enabled: request !== null,
        staleTime: 30_000,
      }
    }),
  )
  const lensCounts = computed(() =>
    requestOf.value !== null && !lensQuery.isError.value ? (lensQuery.data.value ?? null) : null,
  )
  return lensCounts
}

export function useTaskBadges(
  phase: Phase = CURRENT_PHASE,
  fetcher: (signal?: AbortSignal) => Promise<DashboardCounts> = fetchDashboardCounts,
  countsFetcher: (
    request: ShellCountsRequest,
    signal?: AbortSignal,
  ) => Promise<ShellWorkCounts> = fetchShellWorkCounts,
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
  const lensCounts = useLensCounts(live, countsFetcher)
  const query = useQuery(
    computed(() => ({
      queryKey: queryKeys.report.dashboard(store.snapshot),
      // Okuyucu kapısı (CX-F2-Ö-01; faz etkinliğinden bağımsız): eski oturumun okuması yazılmaz.
      queryFn: sessionBound(({ signal }: QueryFunctionContext) => fetcher(signal)),
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
      overdue: positive(lensCounts.value?.overdue),
      pendingDates:
        store.lens === 'coordinator' ? positive(lensCounts.value?.pending_date_requests) : null,
    }
  })
  return { badges }
}

/** Kenar menüsünde ortak bildirim sayacı anahtarı (ortak-kurallar §6). */
export const UNREAD_NOTIFICATIONS_KEY = queryKeys.notifications.unreadCount()

/** Okunmamış bildirim sayısı (E-00-38; zil paneli F7'ye kadar devre dışı). Hata → `null`. */
export function useUnreadNotifications(
  fetcher: (signal?: AbortSignal) => Promise<number> = fetchUnreadNotificationCount,
) {
  const session = useSessionStore()
  const query = useQuery({
    queryKey: UNREAD_NOTIFICATIONS_KEY,
    queryFn: sessionBound(({ signal }: QueryFunctionContext) => fetcher(signal)),
    enabled: computed(() => session.isAuthenticated),
    staleTime: 30_000,
  })
  const count = computed<number | null>(() =>
    query.isError.value ? null : (query.data.value ?? null),
  )
  return { count }
}
