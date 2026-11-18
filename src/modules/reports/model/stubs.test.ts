import { describe, expect, it } from 'vitest'

import { REPORT_PROGRESS } from './stubs'

describe('rapor stub olguları (sahte veri yok; yalnız kullanılabilirlik)', () => {
  it('rapor ilerlemesi kullanılabilir değil', () => {
    expect(REPORT_PROGRESS.available).toBe(false)
  })
})
