import { afterEach, describe, expect, it, vi } from 'vitest'

import { applyTheme, isThemeMode } from './theme'

describe('applyTheme', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme
  })

  it('varsayılan koyu: argümansız çağrı <html data-theme="dark"> yazar', () => {
    expect(applyTheme()).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('açık ve koyu arasında geçer; verilen kök öğeye yazar', () => {
    const root = document.createElement('div')
    expect(applyTheme('light', root)).toBe('light')
    expect(root.dataset.theme).toBe('light')
    expect(applyTheme('dark', root)).toBe('dark')
    expect(root.dataset.theme).toBe('dark')
  })

  it("'system' sistem tercihini okumaz, koyu varsayılana düşer (E-00-37)", () => {
    const matchMedia = vi.fn(() => ({ matches: false }))
    vi.stubGlobal('matchMedia', matchMedia)
    expect(applyTheme('system')).toBe('dark')
    expect(matchMedia).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})

describe('isThemeMode', () => {
  it('yalnız token temalarını kabul eder', () => {
    expect(isThemeMode('dark')).toBe(true)
    expect(isThemeMode('light')).toBe(true)
    expect(isThemeMode('system')).toBe(false)
    expect(isThemeMode(undefined)).toBe(false)
  })
})
