import { describe, expect, it } from 'vitest'

import { buildRoutes, createAppRouter } from './router'
import {
  liveRouteNames,
  menuEntries,
  parseRouteQuery,
  ROUTES,
  routeLocation,
  visibilityOf,
} from './routes.catalog'
import { createMemoryHistory } from 'vue-router'

import {
  DELETED_RECORDS_QUERY_KEYS,
  DELETED_RECORDS_ROUTE,
  deletedRecordsRoutes,
} from '@/modules/deleted-records/public'

// 12 Silinen kayıtlar rota kataloğu satırı (F5; W128): modül sabitleri ve katalog tek kaynakta.
describe('silinen kayıtlar rotası (F5)', () => {
  it('ad, yol, kapsam ve faz katalogla birebir', () => {
    const spec = ROUTES[DELETED_RECORDS_ROUTE.name]
    expect(spec.path).toBe(DELETED_RECORDS_ROUTE.path)
    expect(spec.path).toBe('/silinen-kayitlar')
    expect(spec.scope).toBe('S2')
    expect(spec.phase).toBe('F5')
    expect(deletedRecordsRoutes.map((r) => r.name)).toEqual(['deleted-records.list'])
    expect(visibilityOf('deleted-records.list', 'F4')).toBe('gizli')
    expect(visibilityOf('deleted-records.list', 'F5')).toBe('canli')
    expect(liveRouteNames('F5')).toContain('deleted-records.list')
  })

  it('kenar menüsünde giriş yok (P36, E-12-64)', () => {
    expect('menu' in ROUTES['deleted-records.list']).toBe(false)
    expect(menuEntries().map((e) => e.title)).not.toContain('Silinen kayıtlar')
  })

  it('URL süzgeç adları modül sabitleriyle aynı (tur, q, koordinatorluk, kayit, aralik, silen)', () => {
    expect([...DELETED_RECORDS_QUERY_KEYS].sort()).toEqual(
      Object.keys(ROUTES['deleted-records.list'].query).sort(),
    )
    expect(Object.keys(ROUTES['deleted-records.list'].params)).toEqual([])
  })

  it('tipli süzgeçler: tur dört canlı değer, aralık üç değer; devre dışı türler tanınmaz', () => {
    expect(
      parseRouteQuery('deleted-records.list', {
        tur: 'koordinatorluk',
        aralik: '7gun',
        q: 'fuar',
        koordinatorluk: 'd1',
        kayit: 'w1',
        silen: 'a7',
      }),
    ).toEqual({
      tur: 'koordinatorluk',
      aralik: '7gun',
      q: 'fuar',
      koordinatorluk: 'd1',
      kayit: 'w1',
      silen: 'a7',
    })
    for (const tur of ['altgorev', 'dosya', 'notgundem', 'tumu']) {
      expect(parseRouteQuery('deleted-records.list', { tur }), tur).toEqual({})
    }
    expect(parseRouteQuery('deleted-records.list', { aralik: '30gun' })).toEqual({})
    expect(routeLocation('deleted-records.list', {}, { tur: 'kullanici' })).toEqual({
      name: 'deleted-records.list',
      params: {},
      query: { tur: 'kullanici' },
    })
  })

  it('router kaydı: rota sayfaya bağlı ve katalog meta’sı doğru', async () => {
    expect(buildRoutes().some((r) => r.name === 'deleted-records.list')).toBe(true)
    const router = createAppRouter(createMemoryHistory())
    await router.push('/silinen-kayitlar?tur=toplanti')
    const current = router.currentRoute.value
    expect(current.name).toBe('deleted-records.list')
    expect(current.meta).toMatchObject({ scope: 'S2', title: 'Silinen kayıtlar' })
    expect(current.meta.menuKey).toBeUndefined()
  })
})
