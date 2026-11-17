import { describe, expect, it } from 'vitest'

import { linkTargetSeq } from './link-target'

describe('linkTargetSeq', () => {
  it('yalnız pozitif tam sayı dizesi hedeftir', () => {
    expect(linkTargetSeq('55')).toBe(55)
    for (const bad of [undefined, null, '', '0', '-3', '1.5', 'abc', ['5'], 7]) {
      expect(linkTargetSeq(bad)).toBeNull()
    }
  })
})
