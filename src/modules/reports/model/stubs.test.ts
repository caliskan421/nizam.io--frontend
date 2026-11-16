import { describe, expect, it } from 'vitest'

import { REPORT_PROGRESS, SEASON_TEMPLATE } from './stubs'

describe('rapor stub olguları (sahte veri yok; yalnız kullanılabilirlik)', () => {
  it('hiçbiri kullanılabilir değil', () => {
    expect(REPORT_PROGRESS.available).toBe(false)
    expect(SEASON_TEMPLATE).toEqual({ gantt: false })
  })
})
