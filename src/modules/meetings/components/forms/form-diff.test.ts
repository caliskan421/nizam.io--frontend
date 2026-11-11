import { expect, it } from 'vitest'
import type { MeetingDetail } from '../../model/types'
import { meetingChanges } from './form-diff'
it('sends only changed editable fields and never person members', () => {
  const meeting = { title: 'Eski', invite_mode: 'person', members_included: false } as MeetingDetail
  expect(
    meetingChanges(meeting, {
      title: 'Yeni',
      meetingDate: null,
      dateChanged: false,
      members: true,
    }),
  ).toEqual({ title: 'Yeni' })
  expect(
    meetingChanges(meeting, {
      title: 'Eski',
      meetingDate: '2099-01-01T00:00:00Z',
      dateChanged: true,
      members: false,
    }),
  ).toEqual({ meeting_date: '2099-01-01T00:00:00Z' })
})
