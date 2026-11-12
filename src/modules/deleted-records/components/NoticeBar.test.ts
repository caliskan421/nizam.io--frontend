import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import NoticeBar from './NoticeBar.vue'

describe('NoticeBar', () => {
  it('Koordinatörlük yolu ve kapat olayları', async () => {
    const wrapper = mount(NoticeBar, {
      props: { message: 'Önce geri yükleyin.', departmentsLink: true },
    })
    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.text()).toContain('Önce geri yükleyin.')
    await wrapper.get('[data-testid="dr-open-departments"]').trigger('click')
    await wrapper.findAll('button')[1]!.trigger('click')
    expect(wrapper.emitted('departments')).toHaveLength(1)
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })

  it('bağlantı gerekmiyorsa yalnız kapat', () => {
    const wrapper = mount(NoticeBar, { props: { message: 'X', departmentsLink: false } })
    expect(wrapper.find('[data-testid="dr-open-departments"]').exists()).toBe(false)
  })
})
