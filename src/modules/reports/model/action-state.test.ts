import { describe, expect, it } from 'vitest'

import { canStart, reportActionState, showsRetry, type ReportActionInputs } from './action-state'

const idle: ReportActionInputs = {
  disabled: false,
  pending: false,
  gateBusy: false,
  cooldown: 0,
  phase: 'idle',
}
const state = (over: Partial<ReportActionInputs>) => reportActionState({ ...idle, ...over })

describe('rapor düğmesi durum makinesi', () => {
  it('hazır → hazırlanıyor → indirildi / hata', () => {
    expect(state({})).toBe('ready')
    expect(state({ pending: true })).toBe('preparing')
    expect(state({ phase: 'downloaded' })).toBe('downloaded')
    expect(state({ phase: 'failed' })).toBe('failed')
  })

  it('öncelik: devre dışı > hazırlanıyor > kilitli > sayaç > sonuç', () => {
    expect(state({ disabled: true, pending: true })).toBe('disabled')
    expect(state({ pending: true, gateBusy: true })).toBe('preparing')
    expect(state({ gateBusy: true, cooldown: 5, phase: 'failed' })).toBe('locked')
    expect(state({ cooldown: 5, phase: 'failed' })).toBe('cooldown')
  })

  it('yalnız hazır/başarısız/indirildi durumunda tıklanır', () => {
    for (const s of ['ready', 'failed', 'downloaded'] as const) expect(canStart(s)).toBe(true)
    for (const s of ['disabled', 'preparing', 'locked', 'cooldown'] as const) {
      expect(canStart(s)).toBe(false)
    }
  })

  it('"Yeniden dene" etiketi sayaçlı 429 dışındaki hatalarda', () => {
    const f = (kind: 'capacity_full' | 'rate_limited' | 'export_in_progress') =>
      showsRetry({ kind, code: 'x', messageKey: 'k', retryAfter: null })
    expect(f('capacity_full')).toBe(true)
    expect(f('rate_limited')).toBe(false)
    expect(f('export_in_progress')).toBe(false)
    expect(showsRetry(null)).toBe(false)
  })
})
