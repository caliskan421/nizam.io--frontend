import { describe, expect, it } from 'vitest'

import { buildCrumbs } from './crumbs'

describe('konum izi (E-00-35)', () => {
  it('program tam adı ana sayfaya bağlantı + sayfa adı', () => {
    const crumbs = buildCrumbs({
      routeName: 'identity.session',
      programName: 'Şanlıurfa Teknofest',
      openState: null,
    })
    expect(crumbs.links).toEqual([
      { label: 'Şanlıurfa Teknofest', to: { name: 'home', params: {}, query: {} } },
    ])
    expect(crumbs.current).toBe('Oturum')
  })

  it('program seçili değilse program parçası yok', () => {
    const crumbs = buildCrumbs({ routeName: 'home', programName: null, openState: null })
    expect(crumbs).toEqual({ links: [], current: 'Ana sayfa' })
  })

  it('ara parça üst rota; canlı değilse bağlantı değil (işlevsiz bağlantı yok)', () => {
    const f0 = buildCrumbs({
      routeName: 'organization.coordinatorship',
      programName: 'P',
      openState: null,
      phase: 'F0',
    })
    expect(f0.links[1]).toEqual({ label: 'Koordinatörlükler', to: null })
    expect(f0.current).toBe('Koordinatörlük')
    const f2 = buildCrumbs({
      routeName: 'organization.coordinatorship',
      programName: 'P',
      openState: null,
      phase: 'F2',
    })
    expect(f2.links[1]?.to).toEqual({
      name: 'organization.coordinatorships',
      params: {},
      query: {},
    })
  })

  it('açık durumda son parça açık durum başlığı, ara parça yok', () => {
    const crumbs = buildCrumbs({
      routeName: 'organization.coordinatorship',
      programName: null,
      openState: 'state.membership-pending',
      phase: 'F2',
    })
    expect(crumbs).toEqual({ links: [], current: 'Departman ataması bekleniyor' })
  })

  it('rota adı yoksa yalnız program', () => {
    expect(buildCrumbs({ routeName: null, programName: 'P', openState: null }).current).toBeNull()
  })
})
