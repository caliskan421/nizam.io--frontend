import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { createFakeLifecycle, setupWithScope, sideContext } from './__tests__/fake-lifecycle'
import { useTaskBadges, useUnreadNotifications, type DashboardCounts } from './badges'

const session = vi.hoisted(() => ({ isAuthenticated: true }))
vi.mock('@/shared/session/store', () => ({ useSessionStore: () => session }))

function counts(overdue: number, dates: number): DashboardCounts {
  return { overdue_tasks: overdue, pending_date_changes: dates }
}

async function boot(
  lens: 'admin' | 'coordinator' | 'member',
  phase: 'F0' | 'F1',
  fetcher: () => Promise<DashboardCounts>,
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
  const { badges } = setupWithScope(ctx, lifecycle, () => useTaskBadges(phase, fetcher))
  await flushPromises()
  return { badges, ctx, store }
}

describe('Görevler rozetleri', () => {
  it('F0: öğe devre dışı, reportDashboard çağrılmaz', async () => {
    const fetcher = vi.fn(() => Promise.resolve(counts(5, 2)))
    const { badges } = await boot('admin', 'F0', fetcher)
    expect(fetcher).not.toHaveBeenCalled()
    expect(badges.value).toEqual({ overdue: null, pendingDates: null })
  })

  it('Admin merceği canlı: reportDashboard sayıları; anahtar kapsamlı', async () => {
    const fetcher = vi.fn(() => Promise.resolve(counts(5, 2)))
    const { badges, ctx, store } = await boot('admin', 'F1', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(badges.value).toEqual({ overdue: 5, pendingDates: 2 })
    expect(ctx.queryClient.getQueryData([...store.queryKey('report', 'dashboard')])).toEqual(
      counts(5, 2),
    )
  })

  it('0 sayıda ve hata durumunda rozet gizli', async () => {
    const zero = await boot('admin', 'F1', () => Promise.resolve(counts(0, 0)))
    expect(zero.badges.value).toEqual({ overdue: null, pendingDates: null })
    const failed = await boot('admin', 'F1', () => Promise.reject(new Error('503')))
    expect(failed.badges.value).toEqual({ overdue: null, pendingDates: null })
  })

  it('Koordinatör/Üye merceği: BE-003 statik, sayı yok, uç çağrılmaz', async () => {
    for (const lens of ['coordinator', 'member'] as const) {
      const fetcher = vi.fn(() => Promise.resolve(counts(5, 2)))
      const { badges } = await boot(lens, 'F1', fetcher)
      expect(fetcher).not.toHaveBeenCalled()
      expect(badges.value).toEqual({ overdue: null, pendingDates: null })
    }
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
    expect(ctx.queryClient.getQueryData(['notifications', 'unread-count'])).toBe(3)
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
