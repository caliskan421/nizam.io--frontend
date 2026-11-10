import { describe, expect, it } from 'vitest'

import { requestExtensions } from './request-extension'
import { DAY_WIDTH } from './timeline'

const RANGE = { start: '2026-11-02', end: '2026-12-20' }
const W = DAY_WIDTH.gun
const task = { start_on: '2026-11-04', end_on: '2026-11-10', planned_end_on: '' }

describe('tarih talebi uzantısı (E-03C-42)', () => {
  it('bitişi uzatan talep: planlanan bitişten talep bitişine sağ uzantı', () => {
    const [ext, ...rest] = requestExtensions(
      task,
      { newStartOn: '2026-11-04', newEndOn: '2026-11-15' },
      RANGE,
      'gun',
    )
    expect(rest).toEqual([])
    expect(ext).toEqual({ side: 'end', x: 9 * W, w: 5 * W })
  })

  it('başlangıcı öne alan talep: sol uzantı', () => {
    const out = requestExtensions(
      task,
      { newStartOn: '2026-11-03', newEndOn: '2026-11-10' },
      RANGE,
      'gun',
    )
    expect(out).toEqual([{ side: 'start', x: W, w: W }])
  })

  it('küçültme talebinde uzantı yok; planlanan bitiş esas alınır', () => {
    expect(
      requestExtensions(task, { newStartOn: '2026-11-05', newEndOn: '2026-11-08' }, RANGE, 'gun'),
    ).toEqual([])
    const planned = { ...task, planned_end_on: '2026-11-12' }
    expect(
      requestExtensions(
        planned,
        { newStartOn: '2026-11-04', newEndOn: '2026-11-12' },
        RANGE,
        'gun',
      ),
    ).toEqual([])
  })

  it('aralığın solundan taşan sol uzantı 0 ile kırpılır; bozuk tarih çizilmez', () => {
    const out = requestExtensions(
      task,
      { newStartOn: '2026-10-20', newEndOn: '2026-11-10' },
      RANGE,
      'gun',
    )
    expect(out).toEqual([{ side: 'start', x: 0, w: 2 * W }])
    expect(
      requestExtensions(
        { ...task, start_on: '' },
        { newStartOn: 'x', newEndOn: 'y' },
        RANGE,
        'gun',
      ),
    ).toEqual([])
  })
})
