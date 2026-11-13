import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { fakeSelection } from './__tests__/workload-fake'
import { WORKLOAD_SELECTION } from './use-workload-selection'
import WorkloadSelectionBar from './WorkloadSelectionBar.vue'

const mountBar = (selection?: ReturnType<typeof fakeSelection>) =>
  mount(WorkloadSelectionBar, {
    global: { provide: selection ? { [WORKLOAD_SELECTION as symbol]: selection } : {} },
  })

describe('WorkloadSelectionBar (E-13-61)', () => {
  it('sağlayıcı yok / rapor eylemi kapalı / seçim yok: çizilmez', () => {
    expect(mountBar().find('[data-testid="users-selbar"]').exists()).toBe(false)
    expect(
      mountBar(fakeSelection({ enabled: false, picked: ['u1'] }))
        .find('[data-testid="users-selbar"]')
        .exists(),
    ).toBe(false)
    expect(mountBar(fakeSelection()).find('[data-testid="users-selbar"]').exists()).toBe(false)
  })

  it('"N üye seçili · Seçimi temizle"; temizleyince seçim boşalır ve `cleared` yayılır', async () => {
    const selection = fakeSelection({ picked: ['u1', 'u2', 'u3'] })
    const w = mountBar(selection)
    expect(w.get('[data-testid="users-selcount"]').text()).toBe('3 üye seçili')
    expect(w.find('[role="status"]').exists()).toBe(true)
    await w.get('[data-testid="users-selclear"]').trigger('click')
    expect(selection.count.value).toBe(0)
    expect(w.emitted('cleared')).toHaveLength(1)
    expect(w.find('[data-testid="users-selbar"]').exists()).toBe(false)
  })
})
