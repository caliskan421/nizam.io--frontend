import { describe, expect, it } from 'vitest'

import { applySuggestion, detectTrigger, matches } from './suggest'

describe('detectTrigger', () => {
  it('imleçten önceki @/# parçasını bulur', () => {
    expect(detectTrigger('Merhaba @ay', 11)).toEqual({ sign: '@', query: 'ay', start: 8, end: 11 })
    expect(detectTrigger('#', 1)).toEqual({ sign: '#', query: '', start: 0, end: 1 })
    expect(detectTrigger('bak #ele', 8)?.query).toBe('ele')
  })
  it('sözcük ortası ya da boşluktan sonra tetiklemez', () => {
    expect(detectTrigger('mail@ornek', 10)).toBeNull()
    expect(detectTrigger('@ay boşluk', 10)).toBeNull()
    expect(detectTrigger('düz metin', 9)).toBeNull()
  })
})

describe('applySuggestion', () => {
  it('parçayı çip metniyle değiştirir ve imleci sonuna alır', () => {
    const trigger = detectTrigger('Merhaba @ay', 11)!
    expect(applySuggestion('Merhaba @ay', trigger, '@Ayşe Yılmaz')).toEqual({
      text: 'Merhaba @Ayşe Yılmaz ',
      caret: 21,
    })
  })
  it('metin ortasında araya ekler', () => {
    const text = 'a @e sonra'
    const trigger = detectTrigger(text, 4)!
    expect(applySuggestion(text, trigger, '@Elif')).toEqual({ text: 'a @Elif sonra', caret: 8 })
  })
})

describe('matches', () => {
  it('Türkçe büyük/küçük harf ve sözcük başı', () => {
    expect(matches('ış', 'Işık Demir')).toBe(true)
    expect(matches('dem', 'Işık Demir')).toBe(true)
    expect(matches('ık', 'Işık Demir')).toBe(false)
    expect(matches('', 'Herkes')).toBe(true)
  })
})
