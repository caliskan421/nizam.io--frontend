import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { ICONS, type IconName } from './icons'
import UiIcon from './UiIcon.vue'

describe('UiIcon', () => {
  it('her simge tasarım yolunu çizer, süs olarak gizlidir', () => {
    for (const name of Object.keys(ICONS) as IconName[]) {
      const svg = mount(UiIcon, { props: { name } }).get('svg')
      expect(svg.classes()).toContain('t-icon')
      expect(svg.attributes('aria-hidden')).toBe('true')
      expect(svg.attributes('viewBox')).toBe('0 0 24 24')
      expect(svg.get('path').attributes('d')).toBe(ICONS[name])
    }
  })

  it('boy ve kalın çizgi sınıfları', () => {
    const svg = mount(UiIcon, { props: { name: 'rocket', size: 'sm', bold: true } }).get('svg')
    expect(svg.classes()).toEqual(expect.arrayContaining(['t-icon--sm', 't-icon--bold']))
    const md = mount(UiIcon, { props: { name: 'home' } }).get('svg')
    expect(md.classes()).not.toContain('t-icon--md')
  })

  it('her yol yalnız SVG yol komutlarından oluşur', () => {
    for (const d of Object.values(ICONS)) expect(d).toMatch(/^M[0-9MmLlHhVvCcSsAaZz .,-]+$/)
  })
})
