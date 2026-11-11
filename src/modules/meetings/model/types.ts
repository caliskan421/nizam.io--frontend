import type { components, operations } from '@/shared/api/schema'

export type MeetingFilters = NonNullable<operations['listMeetings']['parameters']['query']>
export type MeetingDetail = components['schemas']['MeetingDetail']
