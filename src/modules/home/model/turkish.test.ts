import { describe, expect, it } from 'vitest'

import { lastSpokenWord, possessiveSuffix } from './turkish'

describe('sayı iyelik eki (E-01-04/06)', () => {
  it.each([
    [0, '’ı'],
    [1, '’i'],
    [2, '’si'],
    [3, '’ü'],
    [4, '’ü'],
    [5, '’i'],
    [6, '’sı'],
    [7, '’si'],
    [8, '’i'],
    [9, '’u'],
    [10, '’u'],
    [20, '’si'],
    [30, '’u'],
    [38, '’i'],
    [39, '’u'],
    [40, '’ı'],
    [50, '’si'],
    [60, '’ı'],
    [70, '’i'],
    [80, '’i'],
    [90, '’ı'],
    [100, '’ü'],
    [1000, '’i'],
    [2_000_000, '’u'],
    [3_000_000_000, '’ı'],
  ])('%i → %s', (n, suffix) => {
    expect(possessiveSuffix(n)).toBe(suffix)
  })

  it('son sözcük: birler, onlar, basamak adları; kesir ve işaret yok sayılır', () => {
    expect(lastSpokenWord(121)).toBe('bir')
    expect(lastSpokenWord(1500)).toBe('yüz')
    expect(lastSpokenWord(-40)).toBe('kırk')
    expect(lastSpokenWord(12.7)).toBe('iki')
  })
})
