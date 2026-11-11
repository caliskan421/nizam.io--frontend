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
