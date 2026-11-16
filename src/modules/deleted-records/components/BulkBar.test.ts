import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BulkBar from './BulkBar.vue'

const props = { count: 3, busy: false, canRestore: true, canPurge: true }

describe('BulkBar (E-12-21; BE-114)', () => {
  it('toolbar rolü, "n kayıt seçildi", üç eylem; olaylar', async () => {
    const wrapper = mount(BulkBar, { props })
    expect(wrapper.attributes('role')).toBe('toolbar')
    expect(wrapper.attributes('aria-label')).toBe('Seçili kayıtlar')
    expect(wrapper.get('[role="status"]').text()).toBe('3 kayıt seçildi')
    expect(wrapper.findAll('button').map((b) => b.text())).toEqual([
      'Geri yükle',
      'Kalıcı sil',
      'Seçimi kaldır',
    ])
    await wrapper.get('[data-action="bulk-restore"]').trigger('click')
    await wrapper.get('[data-action="bulk-purge"]').trigger('click')
    await wrapper.get('[data-action="bulk-clear"]').trigger('click')
    expect(wrapper.emitted('restore')).toHaveLength(1)
    expect(wrapper.emitted('purge')).toHaveLength(1)
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('uçuşta eylemler aria-disabled ve olay yaymaz; Seçimi kaldır etkin kalır', async () => {
    const wrapper = mount(BulkBar, { props: { ...props, busy: true } })
    expect(wrapper.get('[data-action="bulk-restore"]').attributes('aria-disabled')).toBe('true')
    await wrapper.get('[data-action="bulk-restore"]').trigger('click')
    await wrapper.get('[data-action="bulk-purge"]').trigger('click')
    expect(wrapper.emitted('restore')).toBeUndefined()
    expect(wrapper.emitted('purge')).toBeUndefined()
    await wrapper.get('[data-action="bulk-clear"]').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('yetkisiz eylem DOM’da yok', () => {
    const wrapper = mount(BulkBar, { props: { ...props, canRestore: false, canPurge: false } })
    expect(wrapper.find('[data-action="bulk-restore"]').exists()).toBe(false)
    expect(wrapper.find('[data-action="bulk-purge"]').exists()).toBe(false)
  })
})
