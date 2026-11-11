import { expect, it } from 'vitest'
import type { MeetingNote } from '../../model/types'
import { noteCount, noteTime, selectNotes } from './notes-view'
it('shows incomplete counts and the instance time zone', () => {
  expect(noteCount(50, true)).toBe('50+')
  expect(noteCount(50, false)).toBe('50')
  expect(noteTime('2026-01-01T00:00:00Z', 'Europe/Istanbul')).toBe('03:00')
})
it('filters the loaded notes by conversion and account', () => {
  const notes = [
    { author_account_id: 'a', converted_to_work_item_id: null },
    { author_account_id: 'b', converted_to_work_item_id: 'w' },
  ] as MeetingNote[]
  expect(selectNotes(notes, 'all', 'a')).toHaveLength(2)
  expect(selectNotes(notes, 'converted', 'a')).toEqual([notes[1]])
  expect(selectNotes(notes, 'mine', 'a')).toEqual([notes[0]])
})

import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { noteFocus } from './notes-view'

it.each(['scope', 'unmount'] as const)(
  'gecikmiş odak %s sonrasında yeni sahibin başlığına geçmez',
  async (change) => {
    let version = 0
    let request!: () => void
    const component = defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        request = noteFocus(root, () => version).heading
        return () =>
          h('section', { ref: root }, [
            h('h2', { tabindex: -1, 'data-testid': 'meeting-notes-title' }, 'Eski'),
          ])
      },
    })
    const wrapper = mount(component, { attachTo: document.body })
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    request()
    if (change === 'scope') version++
    else wrapper.unmount()
    await nextTick()
    expect(document.activeElement).toBe(outside)
    if (change === 'scope') wrapper.unmount()
    outside.remove()
  },
)
