import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import { tokenPx } from '@/shared/tokens/css-var'

import { useNarrow } from './use-narrow'

afterEach(() => vi.unstubAllGlobals())

describe('useNarrow', () => {
  it('matchMedia yoksa geniş varsayılır', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(effectScope().run(useNarrow)!.value).toBe(false)
  })

  it('eşik --rp-narrow-max token değeridir; değişim izlenir; kapsam sökülünce dinleyici kalkar', () => {
    let handler: ((e: MediaQueryListEvent) => void) | null = null
    const query: string[] = []
    vi.stubGlobal('matchMedia', (q: string) => {
      query.push(q)
      return {
        matches: true,
        addEventListener: (_: string, h: (e: MediaQueryListEvent) => void) => (handler = h),
        removeEventListener: () => (handler = null),
      }
    })
    const scope = effectScope()
    const narrow = scope.run(useNarrow)!
    expect(query).toEqual([`(max-width: ${tokenPx('rp-narrow-max')}px)`])
    expect(narrow.value).toBe(true)
    handler!({ matches: false } as MediaQueryListEvent)
    expect(narrow.value).toBe(false)
    scope.stop()
    expect(handler).toBeNull()
  })
})
