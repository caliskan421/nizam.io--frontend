import { describe, expect, it } from 'vitest'

import { revealMove, type Box } from './panel-reveal'

const PANEL: Box = { left: 1059, top: 585, right: 1399, bottom: 884 }
// panel 585…884 yapışık (görünür alan 900, iç boşluk 16); doğal üst kap altında (çok aşağıda)
const OPTS = { gap: 8, room: 400, top: 120, stickyTop: 584, natTop: 1100 }
const bar = (left: number, top: number, right: number): Box => ({
  left,
  top,
  right,
  bottom: top + 24,
})

describe('panel görünür alana getirme (K-1, K-3)', () => {
  it('çakışma yoksa hareket yok', () => {
    expect(revealMove(bar(300, 700, 700), PANEL, OPTS)).toEqual({ scrollY: 0, scrollX: 0 })
    expect(revealMove(bar(1100, 300, 1300), PANEL, OPTS)).toEqual({ scrollY: 0, scrollX: 0 })
  })

  it('çubuk panelin altında kalıyorsa sayfa kaydırılıp çubuk YAPIŞIK panelin üstüne alınır', () => {
    const b = bar(1000, 700, 1200)
    const move = revealMove(b, PANEL, OPTS)
    expect(move.scrollX).toBe(0)
    // kaydırma sonrası çubuk alt kenarı + boşluk <= yapışık panel üstü
    expect(b.bottom - move.scrollY + OPTS.gap).toBeLessThanOrEqual(OPTS.stickyTop)
  })

  it('sayfa daha fazla kayamıyorsa çubuk Gantt yatay kaydırılarak panelin soluna alınır', () => {
    const b = bar(1000, 700, 1200)
    const move = revealMove(b, PANEL, { ...OPTS, room: 0 })
    expect(move.scrollY).toBe(0)
    expect(b.right - move.scrollX + OPTS.gap).toBeLessThanOrEqual(PANEL.left)
  })

  it('çubuk kaydırınca üst sınırı aşacaksa ya da doğal panelin altındaysa yatay çözüm', () => {
    const high = revealMove(bar(1000, 590, 1200), { ...PANEL, top: 500 }, { ...OPTS, top: 580 })
    expect(high.scrollY).toBe(0)
    expect(high.scrollX).toBeGreaterThan(0)
    const belowNatural = revealMove(bar(1000, 700, 1200), PANEL, { ...OPTS, natTop: 650 })
    expect(belowNatural.scrollY).toBe(0)
    expect(belowNatural.scrollX).toBeGreaterThan(0)
  })
})
