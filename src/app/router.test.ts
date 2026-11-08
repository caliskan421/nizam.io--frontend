import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import { describe, expect, it } from 'vitest'

import { buildRoutes, createAppRouter, INTERIM_REDIRECTS, MODULE_ROUTES } from './router'
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

  it('sayfası olmayan canlı rota geçici yönlendirmeyle bağlanır (F0 ana sayfa → oturum)', async () => {
    expect(INTERIM_REDIRECTS.home).toBe('identity.session')
    const router = memoryRouter(buildRoutes('F0'))
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('identity.session')
  })

  it('gizli rotanın yolu kayıtlı değildir; bilinmeyen yol gibi ana sayfaya düşer', async () => {
    const router = memoryRouter(buildRoutes('F0'))
    for (const path of ['/gorevler', '/kullanicilar/abc', '/toplantilar', '/admin']) {
      await router.push(path)
      expect(router.currentRoute.value.name, path).toBe('identity.session')
    }
    expect(router.hasRoute('work.tasks')).toBe(false)
  })

  it('ileri fazda sayfası olmayan canlı rota hatadır (sessiz boş rota yok)', () => {
    expect(() => buildRoutes('F1')).toThrow(/sayfası yok: work.tasks/)
  })

  it('modülün sayfası ileri fazda canlı rotayı bağlar', () => {
    const records: RouteRecordRaw[] = [
      ...MODULE_ROUTES,
      { path: '/gorevler', name: 'work.tasks', component: view, meta: { scope: 'S2' } },
    ]
    const routes = buildRoutes('F1', records)
    expect(routes.find((r) => r.name === 'work.tasks')?.path).toBe('/gorevler')
    expect(liveRouteNames('F1')).toContain('work.tasks')
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
    expect(() => buildRoutes('F0', [...MODULE_ROUTES, record])).toThrow(error)
  })

  it('uygulama router’ı katalogdan kurulur', () => {
    const router = createAppRouter(createMemoryHistory())
    expect(
      router
        .getRoutes()
        .map((r) => r.name)
        .filter(Boolean),
    ).toEqual(expect.arrayContaining(['home', 'identity.session']))
  })
})
