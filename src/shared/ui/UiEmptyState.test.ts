import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiEmptyState from './UiEmptyState.vue'

describe('UiEmptyState', () => {
  it('başlık, açıklama, simge ve eylem yuvası', () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: 'Program yok', text: 'İlk programı oluşturun.', icon: 'season' },
      slots: { action: '<button>Program oluştur</button>' },
    })
    expect(wrapper.classes()).toContain('rp-empty')
    expect(wrapper.get('.rp-empty__title').text()).toBe('Program yok')
    expect(wrapper.get('.rp-empty__text').text()).toBe('İlk programı oluşturun.')
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.get('button').text()).toBe('Program oluştur')
  })

  it('yalnız başlık', () => {
    const wrapper = mount(UiEmptyState, { props: { title: 'Görev yok' } })
    expect(wrapper.find('.rp-empty__text').exists()).toBe(false)
    expect(wrapper.find('svg').exists()).toBe(false)
  })
})
