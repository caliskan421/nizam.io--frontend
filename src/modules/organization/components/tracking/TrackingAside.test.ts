import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { TrackingItem } from './model'
import TrackingAside from './TrackingAside.vue'

function item(id: string, patch: Partial<TrackingItem> = {}): TrackingItem {
  return {
    work_item_id: id,
    department_id: 'd1',
    title: id,
    status: 'devam_ediyor',
    end_on: '2026-10-23',
    is_overdue: false,
    days_overdue: 0,
    ...patch,
  }
}

const ITEMS = [
  item('a', { end_on: '2026-10-04', is_overdue: true, days_overdue: 17 }),
  item('b', { status: 'onaya_sunuldu' }),
  item('c', { status: 'baslanmadi', end_on: '2026-10-30' }),
  item('d', { status: 'tamamlandi', end_on: '2026-10-28' }),
]

function render() {
  return mount(TrackingAside, { props: { items: ITEMS, month: '2026-10', today: '2026-10-21' } })
}

describe('takvim (E-05-68…72)', () => {
  it('başlık, ızgara adı, pazartesi başlar, gün etiketleri', () => {
    const wrapper = render()
    expect(wrapper.find('[data-calendar-title]').text()).toBe('Son tarihler · Ekim')
    expect(wrapper.find('[role="grid"]').attributes('aria-label')).toBe('Ekim 2026')
    expect(wrapper.findAll('[role="columnheader"]').map((d) => d.text())).toEqual([
      'Pt',
      'Sa',
      'Ça',
      'Pe',
      'Cu',
      'Ct',
      'Pz',
    ])
    const cell = (d: number) => wrapper.find(`[data-day="${d}"]`)
    expect(cell(4).attributes('aria-label')).toBe('4 Ekim, kaçırılan son tarih')
    expect(cell(23).attributes('aria-label')).toBe('23 Ekim, yaklaşan son tarih')
    expect(cell(28).attributes('data-kind')).toBeUndefined()
    expect(cell(21).classes()).toContain('pt-cal__cell--today')
    expect(cell(3).classes()).toContain('pt-cal__cell--past')
    expect(
      wrapper
        .findAll('[role="row"]')
        .every((r) => r.findAll('[role="gridcell"], [role="columnheader"]').length === 7),
    ).toBe(true)
  })

  it('önceki / sonraki ay klavyeyle (yerel düğme) ve tıkla', async () => {
    const wrapper = render()
    const prev = wrapper.find('[data-month-prev]')
    expect(prev.element.tagName).toBe('BUTTON')
    expect(prev.attributes('aria-label')).toBe('Önceki ay')
    await prev.trigger('click')
    await wrapper.find('[data-month-next]').trigger('click')
    expect(wrapper.emitted('update:month')).toEqual([['2026-09'], ['2026-11']])
  })
})

describe('durum dağılımı (E-05-73…75)', () => {
  it('açık görevlerin 4 durumu; boş dilim çizilmez; aria özeti', () => {
    const wrapper = render()
    const bar = wrapper.find('[data-dist-bar]')
    expect(bar.attributes('role')).toBe('img')
    expect(bar.attributes('aria-label')).toBe(
      '3 görev: 1 başlamadı, 1 devam, 1 onayda, 0 geri gönderildi',
    )
    expect(bar.findAll('[data-slice]').map((s) => s.attributes('data-slice'))).toEqual([
      'baslanmadi',
      'devam_ediyor',
      'onaya_sunuldu',
    ])
    expect(wrapper.findAll('dd').map((d) => [d.attributes('data-count'), d.text()])).toEqual([
      ['baslanmadi', '1'],
      ['devam_ediyor', '1'],
      ['onaya_sunuldu', '1'],
      ['iade_edildi', '0'],
    ])
  })
})
