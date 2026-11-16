import { expect, it } from 'vitest'
import { noteTime } from './notes-view'
it('formats the time in the instance time zone', () => {
  expect(noteTime('2026-01-01T00:00:00Z', 'Europe/Istanbul')).toBe('03:00')
})

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useScopeStore } from '@/shared/scope/store'
import { defineComponent, h, nextTick, ref } from 'vue'
import { noteFocus } from './notes-view'

it.each(['scope', 'unmount'] as const)(
  'gecikmiş odak %s sonrasında yeni sahibin başlığına geçmez',
  async (change) => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const scope = useScopeStore()
    scope.commit({ programId: 'p1', departmentId: 'd1', lens: 'coordinator' })
    let request!: () => void
    const component = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        request = noteFocus(root, () => 0).heading
        return () =>
          h('section', { ref: root }, [
            h('h2', { tabindex: -1, 'data-testid': 'meeting-notes-title' }, 'Eski'),
          ])
      },
    })
    const wrapper = mount(component, { attachTo: document.body, global: { plugins: [pinia] } })
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    request()
    if (change === 'scope') scope.commit({ programId: 'p1', departmentId: 'd2', lens: 'member' })
    else wrapper.unmount()
    await nextTick()
    expect(document.activeElement).toBe(outside)
    if (change === 'scope') wrapper.unmount()
    outside.remove()
  },
)
