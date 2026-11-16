import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import MeetingPersonSelector from './MeetingPersonSelector.vue'

function setup() {
  return mount(MeetingPersonSelector, {
    attachTo: document.body,
    props: {
      selectedIds: ['missing'],
      lockedIds: ['locked'],
      mode: 'draft',
      loading: false,
      error: false,
      candidates: {
        people: [
          { accountId: 'locked', fullName: 'Ada', isParticipant: false },
          { accountId: 'b', fullName: 'İpek', isParticipant: false },
          { accountId: 'c', fullName: 'Cem', isParticipant: true },
        ],
      },
    },
  })
}
it('preserves hidden selections, locks participants, and searches Turkish names', async () => {
  const wrapper = setup()
  expect(document.body.textContent).not.toContain('Liste eksik olabilir')
  expect(document.body.textContent).not.toContain('Yalnız koordine')
  const search = document.querySelector<HTMLInputElement>('input[type=search]')!
  search.value = 'ipek'
  search.dispatchEvent(new Event('input'))
  await wrapper.vm.$nextTick()
  expect(document.body.textContent).toContain('İpek')
  const checkbox = document.querySelector<HTMLInputElement>('input[type=checkbox]')!
  checkbox.click()
  await wrapper.vm.$nextTick()
  ;[...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Uygula'))!.click()
  expect(wrapper.emitted('select')?.[0]?.[0]).toEqual(['missing', 'b'])
  wrapper.unmount()
})
it('locks candidates the server marks as participants', () => {
  const wrapper = setup()
  const boxes = [...document.querySelectorAll<HTMLInputElement>('input[type=checkbox]')]
  expect(boxes.map((box) => box.disabled)).toEqual([true, false, true])
  expect(document.body.textContent).not.toContain('Yalnız koordine')
  wrapper.unmount()
})
it('focuses search and emits close on Escape', async () => {
  const wrapper = setup()
  await wrapper.vm.$nextTick()
  await wrapper.vm.$nextTick()
  const search = document.querySelector<HTMLInputElement>('input[type=search]')!
  expect(document.activeElement).toBe(search)
  search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await wrapper.vm.$nextTick()
  expect(wrapper.emitted('close')).toHaveLength(1)
  wrapper.unmount()
})
