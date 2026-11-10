import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TimelineLegend from './TimelineLegend.vue'

describe('açıklama (E-03C-19)', () => {
  it('beş durum + Geç bitti + Gecikmede + Tarih talebi + Baktığın yer, sırayla', () => {
    const legend = mount(TimelineLegend)
    expect(legend.findAll('li').map((li) => li.text())).toEqual([
      'Başlamadı',
      'Devam ediyor',
      'Onay bekliyor',
      'Geri gönderildi',
      'Tamamlandı',
      'Geç bitti',
      'Gecikmede',
      'Tarih talebi',
      'Baktığın yer',
    ])
    expect(legend.get('ul').attributes('aria-label')).toBe('Açıklama')
  })

  it('"sezon" ve 03d açıklaması yok (E-03C-20)', () => {
    const legend = mount(TimelineLegend)
    expect(legend.text().toLowerCase()).not.toContain('sezon')
    expect(legend.text()).not.toContain('Alt görev')
  })

  it('süs işaretleri ekran okuyucudan gizli; metin her öğede', () => {
    const legend = mount(TimelineLegend)
    for (const mark of legend.findAll('[aria-hidden="true"]')) {
      expect(mark.text()).toBe('')
    }
    expect(legend.findAll('.tl-legend__dot')).toHaveLength(6)
  })
})
