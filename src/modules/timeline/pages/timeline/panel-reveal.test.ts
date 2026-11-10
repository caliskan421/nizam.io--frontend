import { describe, expect, it } from 'vitest'

import { intersects, revealMove, type Box } from './panel-reveal'

const PANEL: Box = { left: 1059, top: 585, right: 1399, bottom: 884 }
const OPTS = { gap: 8, room: 400, top: 120 }
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

  it('çubuk panelin altında kalıyorsa sayfa kaydırılıp çubuk panelin üstüne alınır', () => {
    const b = bar(1000, 700, 1200)
    const move = revealMove(b, PANEL, OPTS)
    expect(move.scrollX).toBe(0)
    expect(b.top - move.scrollY + 24 + OPTS.gap).toBeLessThanOrEqual(PANEL.top)
    expect(
      intersects({ ...b, top: b.top - move.scrollY, bottom: b.bottom - move.scrollY }, PANEL, 0),
    ).toBe(false)
  })

  it('sayfa daha fazla kayamıyorsa çubuk Gantt yatay kaydırılarak panelin soluna alınır', () => {
    const b = bar(1000, 700, 1200)
    const move = revealMove(b, PANEL, { ...OPTS, room: 0 })
    expect(move.scrollY).toBe(0)
    expect(b.right - move.scrollX + OPTS.gap).toBeLessThanOrEqual(PANEL.left)
  })

  it('çubuk yukarı çıkarılırsa üst sınırın altında kalmalı; yoksa yatay çözüm', () => {
    const b = bar(1000, 130, 1200)
    const tall: Box = { ...PANEL, top: 100 }
    const move = revealMove(b, tall, OPTS)
    expect(130 - move.scrollY).toBeGreaterThanOrEqual(OPTS.top)
    expect(move.scrollX).toBeGreaterThan(0)
  })
})
