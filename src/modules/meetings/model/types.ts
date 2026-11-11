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

export type CreateMeetingRequest = components['schemas']['CreateMeetingRequest']
export type UpdateMeetingRequest = components['schemas']['UpdateMeetingRequest']
export type Meeting = components['schemas']['Meeting']
export type MeetingCreated = components['schemas']['MeetingCreated']
export type MeetingLifecycleResult = components['schemas']['MeetingLifecycleResult']
export interface MeetingTarget {
  programId: string
  id: string
}
export interface CreateMeetingInput {
  programId: string
  body: CreateMeetingRequest
}
export interface UpdateMeetingInput extends MeetingTarget {
  body: UpdateMeetingRequest
}
