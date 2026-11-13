import { afterEach, describe, expect, it } from 'vitest'

import { mountWith, resetAll } from '../__tests__/harness'
import CoordToolbar from './CoordToolbar.vue'

afterEach(resetAll)

const COUNTS = { all: 11, late: 7, on_track: 4, no_coordinator: 1 }
const props = (over: Record<string, unknown> = {}) => ({
  counts: COUNTS,
  sortKey: 'late',
  reversed: false,
  text: '',
  filter: 'all',
  ...over,
})

describe('koordinatörlük araç çubuğu (E-01-23…26)', () => {
  it('arama kutusu ve dört durum süzgeci sayılarıyla', async () => {
    const { wrapper } = await mountWith(CoordToolbar, null, props())
    const input = wrapper.get('input[type="search"]')
    expect(input.attributes('placeholder')).toBe('Koordinatörlük ara')
    expect(input.attributes('aria-label')).toBe('Koordinatörlük ara')
    const seg = wrapper.get('[role="group"][aria-label="Durum filtresi"]')
    expect(seg.findAll('button').map((b) => b.text())).toEqual([
      'Tümü 11',
      'Gecikmesi olan 7',
      'Yolunda 4',
      'Koordinatörsüz 1',
    ])
    expect(seg.get('[aria-pressed="true"]').text()).toContain('Tümü')
  })

  it('arama metni ve süzgeç seçimi güncelleme olayı yayar', async () => {
    const { wrapper } = await mountWith(CoordToolbar, null, props())
    await wrapper.get('input[type="search"]').setValue('altyapı')
    const buttons = wrapper.get('[role="group"][aria-label="Durum filtresi"]').findAll('button')
    await buttons[2]!.trigger('click')
    const toolbar = wrapper.findComponent(CoordToolbar)
    expect(toolbar.emitted('update:text')).toEqual([['altyapı']])
    expect(toolbar.emitted('update:filter')).toEqual([['on_track']])
  })

  it('sıralama menüsü olayları yukarı iletilir', async () => {
    const { wrapper } = await mountWith(CoordToolbar, null, props({ sortKey: 'name' }))
    expect(wrapper.get('.home-sort__btn').text()).toBe('Sırala: Ad ↓')
    await wrapper.get('.home-sort__btn').trigger('click')
    await wrapper.get('[data-sort="members"]').trigger('click')
    await wrapper.get('.home-sort__btn').trigger('click')
    await wrapper.get('[data-sort="flip"]').trigger('click')
    const toolbar = wrapper.findComponent(CoordToolbar)
    expect(toolbar.emitted('pick')).toEqual([['members']])
    expect(toolbar.emitted('flip')).toHaveLength(1)
  })
})
