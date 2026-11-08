import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiIconButton from './UiIconButton.vue'

describe('UiIconButton', () => {
  it('erişim adı ve ipucu label’dan; simge süs', () => {
    const button = mount(UiIconButton, { props: { icon: 'logout', label: 'Çıkış yap' } }).get(
      'button',
    )
    expect(button.classes()).toEqual(['t-iconbtn'])
    expect(button.attributes('aria-label')).toBe('Çıkış yap')
    expect(button.attributes('title')).toBe('Çıkış yap')
    expect(button.get('svg').attributes('aria-hidden')).toBe('true')
  })

  it('boy, ton ve yuvarlak sınıfları', () => {
    const button = mount(UiIconButton, {
      props: { icon: 'trash', label: 'Görevi sil', size: 'md', tone: 'danger', round: true },
    }).get('button')
    expect(button.classes()).toEqual(
      expect.arrayContaining(['t-iconbtn--md', 't-iconbtn--danger', 't-iconbtn--round']),
    )
  })

  it('devre dışı', async () => {
    const wrapper = mount(UiIconButton, {
      props: { icon: 'bell', label: 'Bildirimler', disabled: true },
    })
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
