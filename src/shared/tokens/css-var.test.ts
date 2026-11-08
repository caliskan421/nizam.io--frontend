import { describe, expect, it } from 'vitest'

import { cssVar, tokenPx } from './css-var'

describe('cssVar', () => {
  it('token adını CSS değişken başvurusuna çevirir', () => {
    expect(cssVar('bg-surface')).toBe('var(--bg-surface)')
  })
})

describe('tokenPx', () => {
  it('temasız px token’ının sayısını verir', () => {
    expect(tokenPx('rp-narrow-max')).toBe(900)
    expect(tokenPx('rp-side-w')).toBe(272)
  })

  it('temalı ya da px olmayan token için hata verir', () => {
    expect(() => tokenPx('bg-base')).toThrow(/temasız px değil/)
    expect(() => tokenPx('text-body')).toThrow(/temasız px değil/)
  })
})
