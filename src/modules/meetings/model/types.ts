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
export type AgendaItem = components['schemas']['AgendaItem']
export type AgendaItemRequest = components['schemas']['AgendaItemRequest']
export type UpdateAgendaItemRequest = components['schemas']['UpdateAgendaItemRequest']
export type ParticipantResult = components['schemas']['ParticipantResult']
export interface AddAgendaInput extends MeetingTarget {
  body: AgendaItemRequest
}
export interface AgendaTarget {
  programId: string
  itemId: string
}
export interface UpdateAgendaInput extends AgendaTarget {
  body: UpdateAgendaItemRequest
}
export interface ParticipantInput extends MeetingTarget {
  userId: string
}
export type MeetingNote = components['schemas']['MeetingNote']
export type NoteRequest = components['schemas']['NoteRequest']
export type ReviseMeetingNoteRequest = components['schemas']['ReviseMeetingNoteRequest']
export type ConvertNoteRequest = components['schemas']['ConvertNoteRequest']
export type NoteConverted = components['schemas']['NoteConverted']
export interface AddNoteInput extends MeetingTarget {
  body: NoteRequest
}
export interface NoteTarget extends MeetingTarget {
  noteId: string
}
export interface UpdateNoteInput extends NoteTarget {
  body: ReviseMeetingNoteRequest
}
export interface ConvertNoteInput extends NoteTarget {
  body: ConvertNoteRequest
}
