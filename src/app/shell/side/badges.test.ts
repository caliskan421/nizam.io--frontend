import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { queryKeys, isScopedQueryKey } from '@/shared/http/query-keys'
import { purgeScopedQueries } from '@/shared/scope/lifecycle'

import { createFakeLifecycle, setupWithScope, sideContext } from './__tests__/fake-lifecycle'
import {
  useTaskBadges,
  useUnreadNotifications,
  type DashboardCounts,
  type ShellCountsRequest,
  type ShellWorkCounts,
} from './badges'

const session = vi.hoisted(() => ({ isAuthenticated: true }))
vi.mock('@/shared/session/store', () => ({ useSessionStore: () => session }))

function counts(overdue: number, dates: number): DashboardCounts {
  return { overdue_tasks: overdue, pending_date_changes: dates }
}

const idleCounts = () => Promise.resolve({ overdue: 0, pending_date_requests: 0 })

async function boot(
  lens: 'admin' | 'coordinator' | 'member',
  phase: 'F0' | 'F1',
  fetcher: () => Promise<DashboardCounts>,
  countsFetcher: (r: ShellCountsRequest, s?: AbortSignal) => Promise<ShellWorkCounts> = idleCounts,
) {
  const ctx = await sideContext()
  const { lifecycle, store } = createFakeLifecycle({
    facts: {
      companyAdmin: lens === 'admin',
      coordinator: lens === 'coordinator',
      member: lens === 'member',
    },
  })
  store.commit({ programId: 'p1', lens, departmentId: lens === 'admin' ? null : 'd1' })
  const { badges } = setupWithScope(ctx, lifecycle, () =>
    useTaskBadges(phase, fetcher, countsFetcher),
  )
  await flushPromises()
  return { badges, ctx, store }
}

describe('Görevler rozetleri', () => {
  it('F0: öğe devre dışı, reportDashboard çağrılmaz', async () => {
    const fetcher = vi.fn(() => Promise.resolve(counts(5, 2)))
    const { badges } = await boot('admin', 'F0', fetcher)
    expect(fetcher).not.toHaveBeenCalled()
    expect(badges.value).toEqual({ overdue: null, pendingDates: null, awaitingApproval: null })
  })

  it('Admin merceği canlı: reportDashboard sayıları; anahtar kapsamlı', async () => {
    const fetcher = vi.fn(() => Promise.resolve(counts(5, 2)))
    const { badges, ctx, store } = await boot('admin', 'F1', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(badges.value).toEqual({ overdue: 5, pendingDates: 2, awaitingApproval: null })
    const key = queryKeys.report.dashboard(store.snapshot)
    expect(ctx.queryClient.getQueryData(key)).toEqual(counts(5, 2))
    // Kapsamlı anahtar: kapsam değişiminde temizlik hedefi.
    expect(isScopedQueryKey(key)).toBe(true)
    purgeScopedQueries(ctx.queryClient)
    expect(ctx.queryClient.getQueryData(key)).toBeUndefined()
  })

  it('0 sayıda ve hata durumunda rozet gizli', async () => {
    const zero = await boot('admin', 'F1', () => Promise.resolve(counts(0, 0)))
    expect(zero.badges.value).toEqual({ overdue: null, pendingDates: null, awaitingApproval: null })
    const failed = await boot('admin', 'F1', () => Promise.reject(new Error('503')))
    expect(failed.badges.value).toEqual({
      overdue: null,
      pendingDates: null,
      awaitingApproval: null,
    })
  })

  it('Koordinatör merceği: countProgramWorkItems, seçili birim; geciken + tarih talebi (BE-003)', async () => {
    const dashboard = vi.fn(() => Promise.resolve(counts(9, 9)))
    const countsFetcher = vi.fn<(r: ShellCountsRequest) => Promise<ShellWorkCounts>>(() =>
      Promise.resolve({ overdue: 7, pending_date_requests: 3 }),
    )
    const { badges, ctx, store } = await boot('coordinator', 'F1', dashboard, countsFetcher)
    expect(dashboard).not.toHaveBeenCalled()
    expect(countsFetcher).toHaveBeenCalledTimes(1)
    expect(countsFetcher.mock.calls[0]![0]).toEqual({
      programId: 'p1',
      departmentId: 'd1',
      assigneeAccountId: null,
    })
    expect(badges.value).toEqual({ overdue: 7, pendingDates: 3, awaitingApproval: null })
    // Anahtar kapsamlı ve görev yazmalarının geçersizleme önekinin altında.
    const prefix = queryKeys.workItems.all(store.snapshot)
    const cached = ctx.queryClient
      .getQueryCache()
      .getAll()
      .map((q) => q.queryKey)
      .filter((k) => k.includes('shell-counts'))
    expect(cached).toHaveLength(1)
    expect(cached[0]!.slice(0, prefix.length)).toEqual(prefix)
    expect(isScopedQueryKey(cached[0]!)).toBe(true)
  })

  it('Üye merceği: yalnız bana atananlar (assignee = hesap); tarih talebi rozeti her zaman gizli', async () => {
    const countsFetcher = vi.fn<(r: ShellCountsRequest) => Promise<ShellWorkCounts>>(() =>
      Promise.resolve({ overdue: 2, pending_date_requests: 5 }),
    )
    const { badges } = await boot(
      'member',
      'F1',
      () => Promise.reject(new Error('x')),
      countsFetcher,
    )
    expect(countsFetcher.mock.calls[0]![0]).toEqual({
      programId: 'p1',
      departmentId: 'd1',
      assigneeAccountId: 'acc-1',
    })
    expect(badges.value).toEqual({ overdue: 2, pendingDates: null, awaitingApproval: null })
  })

  it('K/Ü: F0, birim yok, hesap yok → istek yok; 0 ve hata → rozet gizli', async () => {
    const countsFetcher = vi.fn<(r: ShellCountsRequest) => Promise<ShellWorkCounts>>(() =>
      Promise.resolve({ overdue: 4, pending_date_requests: 1 }),
    )
    const f0 = await boot('coordinator', 'F0', () => Promise.reject(new Error('x')), countsFetcher)
    expect(countsFetcher).not.toHaveBeenCalled()
    expect(f0.badges.value).toEqual({ overdue: null, pendingDates: null, awaitingApproval: null })

    const ctx = await sideContext()
    const { lifecycle, store } = createFakeLifecycle({ standing: null })
    store.commit({ programId: 'p1', lens: 'member', departmentId: 'd1' })
    setupWithScope(ctx, lifecycle, () =>
      useTaskBadges('F1', () => Promise.reject(new Error('x')), countsFetcher),
    )
    await flushPromises()
    expect(countsFetcher).not.toHaveBeenCalled()

    const zero = await boot(
      'coordinator',
      'F1',
      () => Promise.reject(new Error('x')),
      () => Promise.resolve({ overdue: 0, pending_date_requests: 0 }),
    )
    expect(zero.badges.value).toEqual({ overdue: null, pendingDates: null, awaitingApproval: null })
    const failed = await boot(
      'coordinator',
      'F1',
      () => Promise.reject(new Error('x')),
      () => Promise.reject(new Error('403')),
    )
    expect(failed.badges.value).toEqual({
      overdue: null,
      pendingDates: null,
      awaitingApproval: null,
    })
  })
})

describe('bildirim sayacı (E-00-38)', () => {
  it('hesap geneli anahtar; hata → null; oturum yoksa istenmez', async () => {
    const ctx = await sideContext()
    const { lifecycle, store } = createFakeLifecycle()
    const fetcher = vi.fn(() => Promise.resolve(3))
    const { count } = setupWithScope(ctx, lifecycle, () => useUnreadNotifications(fetcher))
    await flushPromises()
    expect(count.value).toBe(3)
    expect(ctx.queryClient.getQueryData(queryKeys.notifications.unreadCount())).toBe(3)
    expect(isScopedQueryKey(queryKeys.notifications.unreadCount())).toBe(false)
    purgeScopedQueries(ctx.queryClient)
    expect(ctx.queryClient.getQueryData(queryKeys.notifications.unreadCount())).toBe(3)
    store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await flushPromises()
    expect(fetcher).toHaveBeenCalledTimes(1)

    const failing = setupWithScope(await sideContext(), lifecycle, () =>
      useUnreadNotifications(() => Promise.reject(new Error('x'))),
    )
    await flushPromises()
    expect(failing.count.value).toBeNull()

    session.isAuthenticated = false
    const idle = vi.fn(() => Promise.resolve(1))
    setupWithScope(await sideContext(), lifecycle, () => useUnreadNotifications(idle))
    await flushPromises()
    expect(idle).not.toHaveBeenCalled()
    session.isAuthenticated = true
  })
})
