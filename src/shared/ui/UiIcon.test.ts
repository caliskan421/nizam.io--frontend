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

  it('kalem (Düzenle) tasarım kaynağındaki yol (Koordinatorluk-Detay.dc.html)', () => {
    expect(ICONS.edit).toBe('M4 20h4L19 9l-4-4L4 16zM14 6l4 4')
  })

  it('Kullanıcılar simgeleri tasarım kaynağındaki yollar (Kullanicilar.dc.html; unlock = lock gövdesi)', () => {
    expect(ICONS.download).toBe('M12 4v11M7 10l5 5 5-5M5 20h14')
    expect(ICONS.mail).toBe('M3 6h18v12H3zM3 7l9 6 9-6')
    expect(ICONS.lock).toBe('M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4')
    expect(ICONS.unlock.startsWith('M6 11h12v10H6z')).toBe(true)
  })

  it('her yol yalnız SVG yol komutlarından oluşur', () => {
    for (const d of Object.values(ICONS)) expect(d).toMatch(/^M[0-9MmLlHhVvCcSsAaZz .,-]+$/)
  })
})

it('draws the meeting visibility eye from the design source', () => {
  expect(ICONS.eye).toBe(
    'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  )
})
