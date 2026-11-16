import { describe, expect, it } from 'vitest'

import { REPORT_PROGRESS, SEASON_DETAIL_FIELDS, SEASON_TEMPLATE } from './stubs'

describe('rapor stub olguları (sahte veri yok; yalnız kullanılabilirlik)', () => {
  it('hiçbiri kullanılabilir değil', () => {
    expect(REPORT_PROGRESS.available).toBe(false)
    expect(SEASON_TEMPLATE).toEqual({ gantt: false, workload: false })
    expect(Object.values(SEASON_DETAIL_FIELDS).every((v) => v === false)).toBe(true)
  })
})
