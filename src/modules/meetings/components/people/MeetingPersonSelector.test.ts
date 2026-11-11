import { expect, it } from 'vitest'
import Component from './MeetingPersonSelector.vue'

it('declares its integration contract independently of its body', () => {
  expect(Object.keys(Component.props ?? {}).sort()).toEqual(
    ['selectedIds', 'scopeLimited', 'lockedIds', 'candidates', 'loading', 'error', 'mode'].sort(),
  )
  expect(
    (Array.isArray(Component.emits) ? Component.emits : Object.keys(Component.emits ?? {})).sort(),
  ).toEqual(['close', 'select', 'retry'].sort())
})
