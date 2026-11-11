import { expect, it } from 'vitest'
import Page from './MeetingsPage.vue'

it('has a page declaration independent of its body', () => {
  expect(Object.keys(Page.props ?? {})).toEqual([])
  expect(Page.emits ?? []).toEqual([])
})
