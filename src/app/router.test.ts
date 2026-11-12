import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import { describe, expect, it } from 'vitest'

import { buildRoutes, createAppRouter, MODULE_ROUTES } from './router'
import { liveRouteNames, routeSpec } from './routes.catalog'

const view = { render: () => null }

function memoryRouter(routes: RouteRecordRaw[]) {
  return createRouter({ history: createMemoryHistory(), routes })
}

describe('router — katalog tek kaynak', () => {
  it('F0: yalnız canlı rotalar + bilinmeyen yol yakalayıcı', () => {
    const routes = buildRoutes('F0')
    expect(routes.map((r) => r.name ?? r.path)).toEqual([
      'home',
      'identity.session',
      '/:pathMatch(.*)*',
    ])
  })

  it('yol, kapsam ve başlık katalogdan; modül yolu katalogla aynı', () => {
    expect(MODULE_ROUTES.find((r) => r.name === 'identity.session')?.path).toBe('/oturum')
    const session = buildRoutes('F0').find((r) => r.name === 'identity.session')
    expect(session?.path).toBe(routeSpec('identity.session').path)
    expect(session?.meta).toEqual({ scope: 'S0', title: 'Oturum', menuKey: undefined })
  })

  it('ana sayfa 01 modül sayfasına bağlı (home/public homeRoutes; yönlendirme yok)', async () => {
    const router = memoryRouter(buildRoutes('F0'))
    await router.push('/')
    const current = router.currentRoute.value
    expect(current.name).toBe('home')
    expect(current.redirectedFrom).toBeUndefined()
    expect(current.meta).toEqual({ scope: 'S1', title: 'Ana sayfa', menuKey: 'home' })
    expect(MODULE_ROUTES.find((r) => r.name === 'home')?.path).toBe('/')
    // Gezinme tembel yükleyiciyi çözer; kayıt gerçek sayfa bileşenini taşır.
    expect(current.matched[0]?.components?.default).toMatchObject({ __name: 'HomePage' })
  })

  it('gizli rotanın yolu kayıtlı değildir; bilinmeyen yol gibi ana sayfaya düşer', async () => {
    const router = memoryRouter(buildRoutes('F0'))
    for (const path of ['/gorevler', '/kullanicilar/abc', '/toplantilar', '/admin']) {
      await router.push(path)
      expect(router.currentRoute.value.name, path).toBe('home')
    }
    expect(router.hasRoute('work.tasks')).toBe(false)
  })

  it('sayfası olmayan canlı rota hatadır (sessiz boş rota yok)', () => {
    const withoutTasks = MODULE_ROUTES.filter((r) => r.name !== 'work.tasks')
    expect(() => buildRoutes('F1', withoutTasks)).toThrow(/sayfası yok: work.tasks/)
    const withoutTimeline = MODULE_ROUTES.filter((r) => r.name !== 'work.timeline')
    expect(() => buildRoutes('F3', withoutTimeline)).toThrow(/sayfası yok: work.timeline/)
    const withoutUsers = MODULE_ROUTES.filter((r) => r.name !== 'organization.users')
    expect(() => buildRoutes('F2', withoutUsers)).toThrow(/sayfası yok: organization.users/)
  })

  it('F5 (etkin faz): modül sayfalarına bağlı', async () => {
    const routes = buildRoutes()
    expect(routes.map((r) => r.name ?? r.path)).toEqual([
      'home',
      'identity.session',
      'work.tasks',
      'work.timeline',
      'organization.users',
      'organization.user',
      'organization.coordinatorships',
      'organization.coordinatorship',
      'program.programs',
      'collaboration.meetings',
      'collaboration.meeting',
      'archive.folders',
      'archive.folder',
      'deleted-records.list',
      '/:pathMatch(.*)*',
    ])
    expect(MODULE_ROUTES.find((r) => r.name === 'work.tasks')?.path).toBe('/gorevler')
    expect(liveRouteNames()).toContain('work.tasks')
    const router = memoryRouter(routes)
    await router.push('/gorevler?durum=geciken')
    const current = router.currentRoute.value
    expect(current.name).toBe('work.tasks')
    expect(current.meta).toEqual({ scope: 'S2', title: 'Görevler', menuKey: 'tasks' })
    expect(current.matched[0]?.components?.default).toMatchObject({ __name: 'TasksPage' })
  })

  it('F5: /arsiv ve /arsiv/:klasorId katalogdan kayıtlı (S3, menü Arşiv; sayfa gövdesinden bağımsız)', async () => {
    const router = memoryRouter(buildRoutes())
    await router.push('/arsiv?tur=belge&sirala=ad:azalan')
    expect(router.currentRoute.value.name).toBe('archive.folders')
    expect(router.currentRoute.value.meta).toEqual({
      scope: 'S3',
      title: 'Arşiv',
      menuKey: 'archive',
    })
    await router.push('/arsiv/my-tasks?gorev=w1&gorunum=liste')
    expect(router.currentRoute.value.name).toBe('archive.folder')
    expect(router.currentRoute.value.params).toEqual({ klasorId: 'my-tasks' })
    expect(router.currentRoute.value.meta).toEqual({
      scope: 'S3',
      title: 'Klasör',
      menuKey: 'archive',
    })
    // F4'te gizli: bilinmeyen yol gibi ana sayfaya düşer.
    const f4 = memoryRouter(buildRoutes('F4'))
    await f4.push('/arsiv')
    expect(f4.currentRoute.value.name).toBe('home')
  })

  it('F3: /zaman-cizelgesi çalışır (yer tutucu sayfa gövdesine bağlı olmadan: ad, kapsam, süzgeç)', async () => {
    const router = memoryRouter(buildRoutes())
    await router.push('/zaman-cizelgesi?olcek=ay&durum=geciken')
    const current = router.currentRoute.value
    expect(current.name).toBe('work.timeline')
    expect(current.meta).toMatchObject({ scope: 'S2', title: 'Zaman çizelgesi', menuKey: 'gantt' })
    expect(current.query).toEqual({ olcek: 'ay', durum: 'geciken' })
  })

  it('F1: henüz canlı olmayan rotaların yolu kayıtlı değil', async () => {
    const router = memoryRouter(buildRoutes('F1'))
    for (const path of ['/zaman-cizelgesi', '/kullanicilar', '/toplantilar']) {
      await router.push(path)
      expect(router.currentRoute.value.name, path).toBe('home')
    }
  })

  it.each([
    [{ path: '/x', name: 'admin.users', component: view, meta: { scope: 'S1' } }, /katalogda yok/],
    [{ path: '/', name: 'home', component: view, meta: { scope: 'S0' } }, /kapsamı/],
    [
      { path: '/oturum', name: 'identity.session', component: view, meta: { scope: 'S0' } },
      /iki kez/,
    ],
    [{ path: '/', name: 'home', redirect: '/' }, /bileşensiz/],
    [{ path: '/', name: 'work.tasks', component: view, meta: { scope: 'S2' } }, /yolu katalogla/],
  ] as [RouteRecordRaw, RegExp][])('tutarsız modül rotası reddedilir (%#)', (record, error) => {
    const base = MODULE_ROUTES.filter(
      (r) => r.name !== record.name || r.name === 'identity.session',
    )
    expect(() => buildRoutes('F0', [...base, record])).toThrow(error)
  })

  it('uygulama router’ı katalogdan kurulur', () => {
    const router = createAppRouter(createMemoryHistory())
    expect(
      router
        .getRoutes()
        .map((r) => r.name)
        .filter(Boolean),
    ).toEqual(expect.arrayContaining(['home', 'identity.session', 'work.tasks']))
  })
})
