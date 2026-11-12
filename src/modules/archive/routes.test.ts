import { describe, expect, it } from 'vitest'

import { ROUTES } from '@/app/routes.catalog'

import {
  ARCHIVE_FOLDER_QUERY_KEYS,
  ARCHIVE_FOLDER_ROUTE,
  ARCHIVE_QUERY_KEYS,
  ARCHIVE_ROUTE,
  archiveRoutes,
} from './routes'

describe('arşiv rotaları', () => {
  it('iki S3 rota kayıtlı; sayfa gövdesinden bağımsız (KESİN 22)', () => {
    expect(archiveRoutes.map(({ name, path, meta }) => ({ name, path, meta }))).toEqual([
      { ...ARCHIVE_ROUTE, meta: { scope: 'S3' } },
      { ...ARCHIVE_FOLDER_ROUTE, meta: { scope: 'S3' } },
    ])
    expect(archiveRoutes.every((route) => typeof route.component === 'function')).toBe(true)
  })

  it('ad, yol ve kapsam rota kataloğuyla birebir (router sapmayı hata sayar)', () => {
    for (const route of [ARCHIVE_ROUTE, ARCHIVE_FOLDER_ROUTE]) {
      const spec = ROUTES[route.name]
      expect(spec.path).toBe(route.path)
      expect(spec.scope).toBe('S3')
      expect(spec.phase).toBe('F5')
    }
  })

  it('URL süzgeç adları kataloğun K10 satırlarıyla aynı', () => {
    expect(ARCHIVE_QUERY_KEYS).toEqual(Object.keys(ROUTES['archive.folders'].query))
    expect(ARCHIVE_FOLDER_QUERY_KEYS.slice().sort()).toEqual(
      Object.keys(ROUTES['archive.folder'].query).sort(),
    )
    expect(Object.keys(ROUTES['archive.folder'].params)).toEqual(['klasorId'])
  })

  it('Arşiv menüde (İçerik, archive); Silinen kayıtlar menüye girmez (P36)', () => {
    expect(ROUTES['archive.folders'].menu).toEqual({ group: 'icerik', key: 'archive', order: 2 })
    expect('menu' in ROUTES['archive.folder']).toBe(false)
    const names = Object.keys(ROUTES).join(' ')
    expect(names).not.toMatch(/deleted|silinen/i)
  })
})
