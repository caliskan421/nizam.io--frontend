import { expect, it } from 'vitest'
import { meetingTimestamp } from './meeting-time'

it('converts the installation timezone and rejects nonexistent local times', () => {
  expect(meetingTimestamp('2026-11-11', '10:30', 'Europe/Istanbul')).toBe(
    '2026-11-11T07:30:00.000Z',
  )
  expect(meetingTimestamp('2026-03-29', '02:30', 'Europe/Berlin')).toBeNull()
  expect(meetingTimestamp('', '', 'Europe/Istanbul')).toBeNull()
})
