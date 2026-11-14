import { describe, expect, it } from 'vitest'

import { atBottom, nearTop, planScroll, type ScrollSnapshot } from './scroll'

const snap = (over: Partial<ScrollSnapshot>): ScrollSnapshot => ({
  top: 500,
  height: 1000,
  client: 500,
  firstSeq: 10,
  lastSeq: 20,
  ...over,
})

describe('planScroll', () => {
  it('yeni mesaj + en altta → alta kaydır', () => {
    expect(planScroll(snap({}), snap({ height: 1100, lastSeq: 21 }))).toEqual({ kind: 'bottom' })
  })
  it('yeni mesaj + yukarıda okuyor → konum korunur', () => {
    expect(planScroll(snap({ top: 100 }), snap({ top: 100, height: 1100, lastSeq: 21 }))).toEqual({
      kind: 'keep',
    })
  })
  it('üste eski sayfa eklendi → yükseklik farkı kadar kaydır', () => {
    expect(planScroll(snap({ top: 0 }), snap({ top: 0, height: 1800, firstSeq: 1 }))).toEqual({
      kind: 'shift',
      by: 800,
    })
  })
  it('ilk yükleme (pencere boştu) kararı çağırana bırakır', () => {
    expect(planScroll(snap({ firstSeq: null, lastSeq: null }), snap({}))).toEqual({ kind: 'keep' })
  })
  it('atBottom / nearTop', () => {
    expect(atBottom({ top: 480, height: 1000, client: 500 })).toBe(true)
    expect(atBottom({ top: 100, height: 1000, client: 500 })).toBe(false)
    expect(nearTop({ top: 100, client: 500 })).toBe(true)
    expect(nearTop({ top: 400, client: 500 })).toBe(false)
  })
})
