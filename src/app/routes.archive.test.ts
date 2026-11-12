import { describe, expect, it } from 'vitest'

import { archiveRoutes } from '@/modules/archive/public'
import {
  ARCHIVE_FOLDER_QUERY_KEYS,
  ARCHIVE_FOLDER_ROUTE,
  ARCHIVE_QUERY_KEYS,
  ARCHIVE_ROUTE,
} from '@/modules/archive/public'

import { menuEntries, parseRouteQuery, ROUTES, routeLocation } from './routes.catalog'

// Arşiv (F5; W121) rota kataloğu satırları: modül sabitleri ve katalog tek kaynakta buluşur.
describe('arşiv rota kataloğu (F5)', () => {
  it('ad, yol ve kapsam modül kayıtlarıyla birebir (router sapmayı hata sayar)', () => {
    for (const route of [ARCHIVE_ROUTE, ARCHIVE_FOLDER_ROUTE]) {
      const spec = ROUTES[route.name]
      expect(spec.path).toBe(route.path)
      expect(spec.scope).toBe('S3')
      expect(spec.phase).toBe('F5')
    }
    expect(archiveRoutes.map((r) => r.name)).toEqual(['archive.folders', 'archive.folder'])
  })

  it('URL süzgeç adları modül sabitleriyle aynı', () => {
    expect(ARCHIVE_QUERY_KEYS).toEqual(Object.keys(ROUTES['archive.folders'].query))
    expect(ARCHIVE_FOLDER_QUERY_KEYS.slice().sort()).toEqual(
      Object.keys(ROUTES['archive.folder'].query).sort(),
    )
    expect(Object.keys(ROUTES['archive.folder'].params)).toEqual(['klasorId'])
  })

  it('Arşiv menüde (İçerik, archive); Silinen kayıtlar menüye girmez (P36)', () => {
    expect(ROUTES['archive.folders'].menu).toEqual({ group: 'icerik', key: 'archive', order: 2 })
    expect('menu' in ROUTES['archive.folder']).toBe(false)
    expect(menuEntries().map((e) => e.key)).toContain('archive')
    expect(menuEntries().map((e) => e.title)).not.toContain('Silinen kayıtlar')
    // 12 Silinen kayıtlar katalogdadır (W128) ama menüye girmez: menü alanı yok.
    expect('menu' in ROUTES['deleted-records.list']).toBe(false)
    expect(menuEntries('F4').map((e) => e.key)).not.toContain('archive')
  })

  it('06 süzgeçleri: tur yalnız Tümü/Görsel/Belge (PDF yok), sirala yalnız ad/dosya', () => {
    expect(
      parseRouteQuery('archive.folders', { q: 'rapor', tur: 'belge', sirala: 'dosya:azalan' }),
    ).toEqual({ q: 'rapor', tur: 'belge', sirala: 'dosya:azalan' })
    expect(parseRouteQuery('archive.folders', { tur: 'pdf', sirala: 'sonYukleme:azalan' })).toEqual(
      {},
    )
  })

  it('07 süzgeçleri: etiket kapalı küme, gorunum izgara|liste; sanal klasör kimliği kabul', () => {
    expect(
      parseRouteQuery('archive.folder', { etiket: 'cikti', gorunum: 'liste', gorev: 'w-1' }),
    ).toEqual({ etiket: 'cikti', gorunum: 'liste', gorev: 'w-1' })
    expect(parseRouteQuery('archive.folder', { etiket: 'saha', gorunum: 'kart' })).toEqual({})
    expect(routeLocation('archive.folder', { klasorId: 'my-tasks' }, { dosya: 'f1' })).toEqual({
      name: 'archive.folder',
      params: { klasorId: 'my-tasks' },
      query: { dosya: 'f1' },
    })
    expect(() => routeLocation('archive.folder', { klasorId: 'a/b' })).toThrow()
  })
})
