import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { CURRENT_PHASE, menuEntries } from '@/app/routes.catalog'

import { createFakeLifecycle, setupWithScope, sideContext } from './__tests__/fake-lifecycle'
import { useTaskBadges } from './badges'
import { menuIcon, phaseNote, sideMenuGroups, useSideMenu } from './menu'

const admin = { ready: true, companyAdmin: true }

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

describe('etkin faz F2 (W71 faz geçişi)', () => {
  it('Görevler canlı; Yönetim (Kullanıcılar, Koordinatörlükler) yalnız yöneticide canlı', () => {
    expect(CURRENT_PHASE).toBe('F2')
    const groups = sideMenuGroups(menuEntries(), admin)
    expect(groups.map((g) => g.group)).toEqual(['takip', 'yonetim'])
    expect(groups[0]!.entries.map((e) => [e.key, e.visibility])).toEqual([
      ['home', 'canli'],
      ['tasks', 'canli'],
    ])
    expect(groups[1]!.entries.map((e) => [e.key, e.visibility])).toEqual([
      ['users', 'canli'],
      ['coords', 'canli'],
    ])
    const nonAdmin = sideMenuGroups(menuEntries(), { ready: true, companyAdmin: false })
    expect(nonAdmin.map((g) => g.group)).toEqual(['takip'])
  })

  it('/gorevler rotasında etkin öğe tasks', async () => {
    const ctx = await sideContext('/gorevler')
    const { lifecycle } = createFakeLifecycle()
    const menu = setupWithScope(ctx, lifecycle, () => useSideMenu())
    expect(menu.activeKey.value).toBe('tasks')
  })

  it('Admin rozetleri faz parametresi olmadan reportDashboard’dan gelir; K/Ü BE-003 statik', async () => {
    const fetcher = vi.fn(() => Promise.resolve({ overdue_tasks: 4, pending_date_changes: 1 }))
    const ctx = await sideContext()
    const { lifecycle, store } = createFakeLifecycle()
    store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    const { badges } = setupWithScope(ctx, lifecycle, () => useTaskBadges(undefined, fetcher))
    await flushPromises()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(badges.value).toEqual({ overdue: 4, pendingDates: 1 })

    const coordCtx = await sideContext()
    const coord = createFakeLifecycle({
      facts: { companyAdmin: false, coordinator: true, member: false },
    })
    coord.store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    const idle = vi.fn(() => Promise.resolve({ overdue_tasks: 9, pending_date_changes: 9 }))
    const other = setupWithScope(coordCtx, coord.lifecycle, () => useTaskBadges(undefined, idle))
    await flushPromises()
    expect(idle).not.toHaveBeenCalled()
    expect(other.badges.value).toEqual({ overdue: null, pendingDates: null })
  })
})

describe('kenar menüsü grupları', () => {
  it('F0: yalnız Takip; Görevler devre dışı faz notuyla; boş gruplar başlıksız yok', () => {
    const groups = sideMenuGroups(menuEntries('F0'), admin)
    expect(groups.map((g) => g.group)).toEqual(['takip'])
    expect(groups[0]!.label).toBe('Takip')
    const [home, tasks] = groups[0]!.entries
    expect(home).toMatchObject({ key: 'home', visibility: 'canli' })
    expect(tasks).toMatchObject({ key: 'tasks', visibility: 'devre_disi' })
    expect(phaseNote(tasks!)).toBe('Görevler — F1’de açılacak')
  })

  it('F2: Yönetim yalnız company_admin olgusuyla; standing gelmeden yok', () => {
    const entries = menuEntries('F2')
    expect(sideMenuGroups(entries, admin).map((g) => g.group)).toEqual(['takip', 'yonetim'])
    expect(
      sideMenuGroups(entries, { ready: true, companyAdmin: false }).map((g) => g.group),
    ).toEqual(['takip'])
    expect(
      sideMenuGroups(entries, { ready: false, companyAdmin: true }).map((g) => g.group),
    ).toEqual(['takip'])
  })

  it('v1 dışı öğeler hiçbir fazda yok (Takvim, Arşiv, Mesajlar, Tablolar, Simülasyon, Yardım)', () => {
    const keys = sideMenuGroups(menuEntries('F4'), admin).flatMap((g) =>
      g.entries.map((e) => e.key),
    )
    expect(keys).toEqual(['home', 'tasks', 'meetings', 'users', 'coords'])
    for (const hidden of ['calendar', 'memory', 'archive', 'messages', 'sheets', 'sim', 'season']) {
      expect(keys).not.toContain(hidden)
    }
  })

  it('simgeler menü anahtarından', () => {
    expect(menuIcon('home')).toBe('home')
    expect(menuIcon('coords')).toBe('coords')
    expect(menuIcon('yok-boyle')).toBeUndefined()
  })

  it('P1: yönetici Koordinatör merceğine geçince Yönetim grubu kalır', async () => {
    const ctx = await sideContext('/oturum')
    const { lifecycle, store } = createFakeLifecycle({
      lenses: [
        { lens: 'admin', departmentCount: 0 },
        { lens: 'coordinator', departmentCount: 1 },
      ],
    })
    store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    const menu = setupWithScope(ctx, lifecycle, () => useSideMenu('F2'))
    expect(menu.groups.value.map((g) => g.group)).toContain('yonetim')
    lifecycle.selectLens('coordinator')
    store.setDepartment('d1')
    expect(store.lens).toBe('coordinator')
    expect(lifecycle.facts.value.companyAdmin).toBe(true)
    expect(menu.groups.value.map((g) => g.group)).toContain('yonetim')
  })

  it('etkin öğe katalogdan (alt rota üst öğeyi etkin yapar); katalog dışı rotada yok', async () => {
    const ctx = await sideContext('/oturum')
    const { lifecycle } = createFakeLifecycle()
    const menu = setupWithScope(ctx, lifecycle, () => useSideMenu('F0'))
    expect(menu.activeKey.value).toBeUndefined()
  })
})
