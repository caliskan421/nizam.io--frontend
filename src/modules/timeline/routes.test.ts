import { describe, expect, it } from 'vitest'

import {
  TIMELINE_QUERY_KEYS,
  TIMELINE_ROUTE,
  timelineQueryAfterScopeChange,
  timelineRoutes,
} from './routes'

// Rota testi sayfa gövdesinden bağımsızdır (KESİN 22): kayıt (ad, yol, kapsam) ve yükleyici
// denetlenir; bileşen bağlanmaz, yer tutucu işaretine bakılmaz.
describe('zaman çizelgesi rotası', () => {
  it('kayıt: work.timeline → /zaman-cizelgesi (S2), tembel yükleyici', () => {
    expect(TIMELINE_ROUTE).toEqual({ name: 'work.timeline', path: '/zaman-cizelgesi' })
    expect(timelineRoutes).toHaveLength(1)
    const [record] = timelineRoutes
    expect(record).toMatchObject({
      name: 'work.timeline',
      path: '/zaman-cizelgesi',
      meta: { scope: 'S2' },
    })
    expect(typeof record!.component).toBe('function')
  })

  it('süzgeç adları katalogla aynı küme', () => {
    expect([...TIMELINE_QUERY_KEYS].sort()).toEqual(
      ['altgorev', 'departman', 'durum', 'olcek', 'secili'].sort(),
    )
  })

  it('kapsam değişince ölçek ve durum korunur; departman, seçili görev ve bilinmeyen düşer', () => {
    expect(
      timelineQueryAfterScopeChange({
        durum: 'geciken',
        olcek: 'ay',
        altgorev: 'kapali',
        departman: 'd2',
        secili: 'w1',
        bilinmeyen: 'x',
      }),
    ).toEqual({ durum: 'geciken', olcek: 'ay', altgorev: 'kapali' })
  })
})
