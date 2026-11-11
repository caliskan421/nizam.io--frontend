import { expect, it } from 'vitest'
import Component from './DeletedMeetings.vue'

it('declares its integration contract independently of its body', () => {
  expect(Object.keys(Component.props ?? {}).sort()).toEqual(['items'].sort())
  expect(
    (Array.isArray(Component.emits) ? Component.emits : Object.keys(Component.emits ?? {})).sort(),
  ).toEqual(['close', 'refresh'].sort())
})
