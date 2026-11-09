import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CoordsGlyph from './CoordsGlyph.vue'

describe('08 simgeleri', () => {
  it('süs simgesi: t-icon, aria-hidden, yol verisi dolu', () => {
    for (const name of [
      'branch',
      'user-x',
      'user-alone',
      'list-off',
      'clock',
      'chevron',
    ] as const) {
      const svg = mount(CoordsGlyph, { props: { name } }).get('svg')
      expect(svg.classes()).toEqual(['t-icon', 't-icon--sm'])
      expect(svg.attributes('aria-hidden')).toBe('true')
      expect(svg.get('path').attributes('d')).toMatch(/^M/)
    }
  })
})
