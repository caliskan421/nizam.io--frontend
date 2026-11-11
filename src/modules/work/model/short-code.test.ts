import { describe, expect, it } from 'vitest'

import { workShortCode } from './short-code'

describe('workShortCode', () => {
  it('yalnız gerçek kodu gösterir; eksik kodda boş döner', () => {
    expect(workShortCode('MEK')).toBe('MEK')
    expect(workShortCode(null)).toBe('')
  })
})
