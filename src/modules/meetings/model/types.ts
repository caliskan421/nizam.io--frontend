import type { components, operations } from '@/shared/api/schema'

export type MeetingFilters = NonNullable<operations['listMeetings']['parameters']['query']>
export type MeetingDetail = components['schemas']['MeetingDetail']

export interface MeetingCandidate {
  accountId: string
  fullName: string
}

export interface MeetingCandidates {
  people: MeetingCandidate[]
  truncated: boolean
  /** K yolu yalnız kendi koordinatörlüklerini kapsar. */
  partial: boolean
}
