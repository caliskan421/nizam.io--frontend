import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { i18n } from '@/shared/i18n'
import MeetingHeader from './MeetingHeader.vue'
it('labels partial filtered counts and hides create without capability', () => {
  const wrapper = mount(MeetingHeader, {
    props: {
      program: 'Sezon',
      upcoming: 2,
      past: 1,
      complete: false,
      lensText: 'Üye',
      filtered: true,
      canCreate: false,
    },
    global: { plugins: [i18n] },
  })
  expect(wrapper.text()).toContain('En az 2 yaklaşan, 1 geçmiş toplantı')
  expect(wrapper.text()).toContain('yüklenen kayıtlar içinde')
  expect(wrapper.find('button').exists()).toBe(false)
})
