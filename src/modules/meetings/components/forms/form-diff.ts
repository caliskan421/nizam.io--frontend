import type { MeetingDetail, UpdateMeetingRequest } from '../../model/types'

export function meetingChanges(
  meeting: MeetingDetail,
  values: { title: string; meetingDate: string | null; dateChanged: boolean; members: boolean },
): UpdateMeetingRequest {
  const body: UpdateMeetingRequest = {}
  if (values.title !== meeting.title) body.title = values.title
  if (values.dateChanged) body.meeting_date = values.meetingDate
  if (meeting.invite_mode === 'coordinatorship' && values.members !== meeting.members_included)
    body.members_included = values.members
  return body
}
