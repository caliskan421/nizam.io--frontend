import { describe, expect, it } from 'vitest'

import { workShortCode } from './short-code'

describe('workShortCode', () => {
  it('sunucu kodunu aynen döndürür', () => {
    expect(workShortCode({ code: 'ARGE-12', sequence_no: 12 })).toBe('ARGE-12')
  })

  it('departman kodu yoksa #<sıra> (WORK-K97)', () => {
    expect(workShortCode({ code: null, sequence_no: 4 })).toBe('#4')
  })

  it('kod ve sıra yoksa boş (uydurma yok)', () => {
    expect(workShortCode({ code: null, sequence_no: null })).toBe('')
    expect(workShortCode(null)).toBe('')
    expect(workShortCode(undefined)).toBe('')
  })
})

describe('eski yol yok (KESİN 35d)', () => {
  it('statik "—" sıra üretilmez: kod yoksa #sıra, o da yoksa boş', () => {
    expect(workShortCode({ code: null, sequence_no: 2 })).not.toContain('—')
    expect(workShortCode({ code: null, sequence_no: null })).toBe('')
  })
})
