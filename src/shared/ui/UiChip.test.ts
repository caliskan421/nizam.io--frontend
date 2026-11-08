import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import UiChip from './UiChip.vue'

describe('UiChip', () => {
  it('statik çip: kaldırma düğmesi yok', () => {
    const chip = mount(UiChip, { slots: { default: 'Elektronik' } })
    expect(chip.classes()).toEqual(['t-chip', 't-chip--static'])
    expect(chip.find('button').exists()).toBe(false)
  })

  it('kaldırılabilir çip remove yayar; varsayılan erişim adı', async () => {
    const chip = mount(UiChip, { props: { removable: true }, slots: { default: 'Ayşe' } })
    const x = chip.get('button.t-chip__x')
    expect(x.attributes('aria-label')).toBe('Kaldır')
    await x.trigger('click')
    expect(chip.emitted('remove')).toHaveLength(1)
    const named = mount(UiChip, {
      props: { removable: true, removeLabel: 'Ayşe süzgecini kaldır' },
    })
    expect(named.get('button').attributes('aria-label')).toBe('Ayşe süzgecini kaldır')
  })

  it('devre dışı', async () => {
    const chip = mount(UiChip, { props: { removable: true, disabled: true } })
    expect(chip.get('button').attributes('disabled')).toBeDefined()
    await chip.get('button').trigger('click')
    expect(chip.emitted('remove')).toBeUndefined()
  })
})
