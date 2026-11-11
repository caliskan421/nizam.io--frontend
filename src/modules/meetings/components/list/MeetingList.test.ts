import { expect, it } from 'vitest'
import Component from './MeetingList.vue'

it('declares its integration contract independently of its body', () => {
  expect(Object.keys(Component.props ?? {}).sort()).toEqual(['items', 'complete'].sort())
  expect(
    (Array.isArray(Component.emits) ? Component.emits : Object.keys(Component.emits ?? {})).sort(),
  ).toEqual(['create', 'openDeleted', 'select'].sort())
})
