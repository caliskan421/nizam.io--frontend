import { describe, expect, it } from 'vitest'

import {
  PERIOD_ZIP,
  REPORT_PROGRESS,
  SEASON_DETAIL_FIELDS,
  SEASON_TEMPLATE,
  SECTION_SELECTION,
} from './stubs'

describe('rapor stub olguları (sahte veri yok; yalnız kullanılabilirlik)', () => {
  it('hiçbiri kullanılabilir değil', () => {
    expect(SECTION_SELECTION).toEqual({ partialAvailable: false, departmentFilterAvailable: false })
    expect(PERIOD_ZIP.available).toBe(false)
    expect(REPORT_PROGRESS.available).toBe(false)
    expect(SEASON_TEMPLATE).toEqual({ gantt: false, workload: false })
    expect(Object.values(SEASON_DETAIL_FIELDS).every((v) => v === false)).toBe(true)
  })
})
