// Rapor rota kataloğu satırları (F6; W136): modül sabitleri ve katalog tek kaynakta buluşur.
// Test sayfa gövdesini bağlamaz, yer tutucu beklemez (KESİN 22): yalnız katalog, modül kayıtları
// ve router kaydı denetlenir.
import { describe, expect, it } from 'vitest'

import { REPORT_MEETING_ROUTE, REPORT_SEASON_ROUTE, reportsRoutes } from '@/modules/reports/public'

import { buildRoutes, MODULE_ROUTES } from './router'
import {
  CURRENT_PHASE,
  liveRouteNames,
  menuEntries,
  routeLocation,
  routeTrail,
  ROUTES,
  visibilityOf,
} from './routes.catalog'

describe('rapor rota kataloğu (F6)', () => {
  it('ad, yol ve kapsam modül kayıtlarıyla birebir', () => {
    for (const route of [REPORT_SEASON_ROUTE, REPORT_MEETING_ROUTE]) {
      const spec = ROUTES[route.name]
      expect(spec.path).toBe(route.path)
      expect(spec.scope).toBe('S2')
      expect(spec.phase).toBe('F6')
    }
    expect(reportsRoutes.map((r) => r.name)).toEqual(['reports.season', 'reports.meeting'])
  })

  it('menüsüz; kırıntı Arşiv / Toplantı üzerinden; /raporlar rotası yok (E-13-76)', () => {
    expect('menu' in ROUTES['reports.season']).toBe(false)
    expect('menu' in ROUTES['reports.meeting']).toBe(false)
    expect(routeTrail('reports.season')).toEqual(['archive.folders', 'reports.season'])
    expect(routeTrail('reports.meeting')).toEqual([
      'collaboration.meetings',
      'collaboration.meeting',
      'reports.meeting',
    ])
    expect(Object.values(ROUTES).map((r) => r.path)).not.toContain('/raporlar')
    expect(menuEntries('F6').map((e) => e.key)).not.toContain('reports')
  })

  it('toplantı rotası tipli meetingId parametresi taşır', () => {
    expect(Object.keys(ROUTES['reports.meeting'].params)).toEqual(['meetingId'])
    expect(routeLocation('reports.meeting', { meetingId: 'm1' }, {}, 'F6')).toEqual({
      name: 'reports.meeting',
      params: { meetingId: 'm1' },
      query: {},
    })
  })

  it("faz açılana dek (etkin faz F5) router'a girmez; F6'da canlı", () => {
    expect(CURRENT_PHASE).toBe('F5')
    expect(visibilityOf('reports.season')).toBe('gizli')
    expect(liveRouteNames()).not.toContain('reports.season')
    expect(liveRouteNames('F6')).toEqual(
      expect.arrayContaining(['reports.season', 'reports.meeting']),
    )
    expect(() => routeLocation('reports.season', {})).toThrow(/canlı değil/)
  })

  it('modül kayıtları bağlanınca F6 router kaydı kurulur (statik rota dinamik klasörden önce)', () => {
    const records = buildRoutes('F6', [...MODULE_ROUTES, ...reportsRoutes])
    const season = records.find((r) => r.name === 'reports.season')
    expect(season?.path).toBe('/arsiv/donem-raporu')
    expect(records.find((r) => r.name === 'reports.meeting')?.path).toBe(
      '/toplantilar/:meetingId/rapor',
    )
  })
})
