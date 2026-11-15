import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import { i18n } from '@/shared/i18n'
import MeetingHeader from './MeetingHeader.vue'
it('shows exact server counts and hides create without capability', () => {
  const wrapper = mount(MeetingHeader, {
    props: {
      program: 'Sezon',
      upcoming: 2,
      past: 1,
      lensText: 'Üye',
      canCreate: false,
    },
    global: { plugins: [i18n] },
  })
  expect(wrapper.text()).toContain('2 yaklaşan, 1 geçmiş toplantı')
  expect(wrapper.text()).not.toContain('En az')
  expect(wrapper.text()).not.toContain('yüklenen kayıtlar içinde')
  expect(wrapper.find('button').exists()).toBe(false)
})
it('shows no counts until the server sends them', () => {
  const wrapper = mount(MeetingHeader, {
    props: { program: 'Sezon', upcoming: null, past: null, lensText: 'Üye', canCreate: true },
    global: { plugins: [i18n] },
  })
  expect(wrapper.text()).not.toContain('yaklaşan')
  expect(wrapper.text()).toContain('Sezon')
})
