import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DetailHead from './DetailHead.vue'

describe('panel üst bilgisi (E-03-41, E-03-42, E-03-43)', () => {
  it('kicker + başlık (iki satır kırpma), kapat düğmesi; "Tam sayfada aç" yok', async () => {
    const wrapper = mount(DetailHead, {
      props: { kicker: 'MEK-— · Mekanik sistemler', title: 'Faz3 asfalt işlemi', titleId: 't1' },
    })
    expect(wrapper.get('[data-testid="detail-kicker"]').text()).toBe('MEK-— · Mekanik sistemler')
    const title = wrapper.get('h2')
    expect(title.text()).toBe('Faz3 asfalt işlemi')
    expect(title.attributes('id')).toBe('t1')
    expect(title.classes()).toContain('rp-clamp2')
    expect(wrapper.find('[aria-label="Tam sayfada aç"]').exists()).toBe(false)

    await wrapper.get('button[aria-label="Paneli kapat"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('başlık/kicker yokken (yükleniyor) yalnız kapat', () => {
    const wrapper = mount(DetailHead, { props: { kicker: '', title: null, titleId: 't1' } })
    expect(wrapper.find('h2').exists()).toBe(false)
    expect(wrapper.find('[data-testid="detail-kicker"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Paneli kapat"]').exists()).toBe(true)
  })
})
