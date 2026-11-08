import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { workItem } from '../../model/__tests__/harness'
import DetailTimeline from './DetailTimeline.vue'

const TZ = 'Europe/Istanbul'

describe('ilerleme çizgisi (E-03-51)', () => {
  it('tarih alanlarından olaylar; gecikme satırı kırmızı/kalın; etkinlik akışı BE-007 yer tutucu', () => {
    const item = workItem({
      created_at: '2026-06-10T08:00:00Z',
      start_on: '2026-07-20',
      end_on: '2026-07-25',
      is_overdue: true,
      days_overdue: 88,
    })
    const wrapper = mount(DetailTimeline, { props: { item, timeZone: TZ } })
    const rows = wrapper.findAll('.rp-timeline li')
    expect(rows.map((r) => r.attributes('data-event'))).toEqual([
      'created',
      'start',
      'endPassed',
      'overdue',
    ])
    expect(rows[0]!.text()).toContain('Görev tanımlandı')
    expect(rows[0]!.text()).toContain('10 Haz')
    expect(rows[3]!.text()).toContain('88 gündür gecikmede')
    expect(rows[3]!.text()).toContain('bugün')
    expect(rows[3]!.find('.rp-danger-text').exists()).toBe(true)
    expect(rows[3]!.find('.rp-tl-dot--alert').exists()).toBe(true)

    const stub = wrapper.get('[data-design-stub="BE-007"]')
    expect(stub.find('[data-placeholder]').exists()).toBe(true)
    expect(stub.text()).toBe('Etkinlik geçmişi henüz gösterilemiyor.')
  })

  it('sahte olay üretilmez: durum geçişi / atama / dosya olayı yok', () => {
    const wrapper = mount(DetailTimeline, {
      props: { item: workItem({ status: 'onaya_sunuldu' }), timeZone: TZ },
    })
    const keys = wrapper.findAll('.rp-timeline li').map((r) => r.attributes('data-event'))
    expect(keys).toEqual(['created', 'start'])
    expect(wrapper.text()).not.toMatch(/yüklendi|atandı|onaya sunuldu/i)
  })
})
