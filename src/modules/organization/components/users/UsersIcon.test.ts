import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UsersIcon from './UsersIcon.vue'

describe('UsersIcon', () => {
  it('UiIcon ile aynı işaretleme (t-icon--sm, süs öğesi)', () => {
    const w = mount(UsersIcon, { props: { name: 'download' } })
    expect(w.classes()).toEqual(['t-icon', 't-icon--sm'])
    expect(w.attributes('aria-hidden')).toBe('true')
    expect(w.get('path').attributes('d')).toBe('M12 4v11M7 10l5 5 5-5M5 20h14')
  })
})
