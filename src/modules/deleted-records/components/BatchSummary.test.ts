import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BatchSummary from './BatchSummary.vue'

const summary = {
  message: '1 kayıt işlendi, 2 kayıt işlenemedi.',
  tone: 'danger' as const,
  failures: [
    { id: 'a', title: 'Alfa', reason: 'Kayıt bulunamadı.' },
    { id: 'b', title: 'Beta', reason: 'Bu kayıt işlenemedi.' },
  ],
}

describe('BatchSummary (BE-114)', () => {
  it('mesaj, her başarısız kayıt adı + gerekçe; alert rolü; kapatınca olay', async () => {
    const wrapper = mount(BatchSummary, { props: { summary } })
    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.get('.dr-notice__text').text()).toBe(summary.message)
    expect(wrapper.findAll('li').map((li) => li.text())).toEqual([
      'AlfaKayıt bulunamadı.',
      'BetaBu kayıt işlenemedi.',
    ])
    await wrapper.get('[data-testid="dr-batch-dismiss"]').trigger('click')
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })

  it('başarısız satır yoksa liste çizilmez', () => {
    const wrapper = mount(BatchSummary, { props: { summary: { ...summary, failures: [] } } })
    expect(wrapper.find('ul').exists()).toBe(false)
  })
})
