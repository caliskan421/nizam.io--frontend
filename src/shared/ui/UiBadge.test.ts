import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiBadge from './UiBadge.vue'

describe('UiBadge', () => {
  it('nötr rozet: yalnız t-badge, erişim adı yok', () => {
    const badge = mount(UiBadge, { slots: { default: 'Taslak' } })
    expect(badge.classes()).toEqual(['t-badge'])
    expect(badge.attributes('aria-label')).toBeUndefined()
  })

  it('sayaç rozeti: ton + anlamı taşıyan erişim adı/ipucu', () => {
    const badge = mount(UiBadge, {
      props: { tone: 'danger', count: true, label: '3 geciken görev' },
      slots: { default: '3' },
    })
    expect(badge.classes()).toEqual(['t-badge', 't-badge--danger', 't-badge--count'])
    expect(badge.attributes('aria-label')).toBe('3 geciken görev')
    expect(badge.attributes('title')).toBe('3 geciken görev')
    for (const tone of ['violet', 'gold', 'accent'] as const) {
      expect(mount(UiBadge, { props: { tone } }).classes()).toContain(`t-badge--${tone}`)
    }
  })
})
