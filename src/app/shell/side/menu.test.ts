import { describe, expect, it } from 'vitest'

import { menuEntries } from '@/app/routes.catalog'

import { createFakeLifecycle, setupWithScope, sideContext } from './__tests__/fake-lifecycle'
import { menuIcon, phaseNote, sideMenuGroups, useSideMenu } from './menu'

const admin = { ready: true, companyAdmin: true }

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
