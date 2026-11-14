import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PushSteps from './PushSteps.vue'

describe('PushSteps', () => {
  it('sıralı liste: erişim adı ve adım metinleri çağıranındır', () => {
    const wrapper = mount(PushSteps, { props: { label: 'Adımlar', steps: ['Bir', 'İki', 'Üç'] } })
    const list = wrapper.get('ol')
    expect(list.attributes('aria-label')).toBe('Adımlar')
    expect(wrapper.findAll('li').map((li) => li.text())).toEqual(['Bir', 'İki', 'Üç'])
  })

  it('props: label, steps', () => {
    expect(Object.keys((PushSteps as unknown as { props: object }).props).sort()).toEqual([
      'label',
      'steps',
    ])
  })
})
