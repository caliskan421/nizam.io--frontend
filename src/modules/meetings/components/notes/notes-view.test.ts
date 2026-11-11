import { expect, it } from 'vitest'
import { noteCount, noteTime } from './notes-view'
it('shows incomplete counts and the instance time zone', () => {
  expect(noteCount(50, true)).toBe('50+')
  expect(noteCount(50, false)).toBe('50')
  expect(noteTime('2026-01-01T00:00:00Z', 'Europe/Istanbul')).toBe('03:00')
})
