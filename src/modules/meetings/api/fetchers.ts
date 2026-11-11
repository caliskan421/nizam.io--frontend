import { programHeaders } from '@/modules/work/public'
import { api, unwrap } from '@/shared/http'
import type { operations } from '@/shared/api/schema'

export type MeetingFilters = NonNullable<operations['listMeetings']['parameters']['query']>

/** Tüm toplantı uçları S2'dir; yalnız yakalanmış program başlığı taşır. */
export function fetchMeetings(programId: string, filters: MeetingFilters, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/meetings', {
      params: { header: programHeaders({ programId }), query: { ...filters, limit: 200 } },
      signal,
    }),
  )
}
export function fetchMeeting(programId: string, id: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/meetings/{id}', {
      params: { header: programHeaders({ programId }), path: { id } },
      signal,
    }),
  )
}
export function fetchMeetingNotes(
  programId: string,
  id: string,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    api.GET('/v1/meetings/{id}/notes', {
      params: {
        header: programHeaders({ programId }),
        path: { id },
        query: { cursor, limit: 200 },
      },
      signal,
    }),
  )
}
export function fetchDeletedMeetings(programId: string, cursor?: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/meetings/deleted', {
      params: { header: programHeaders({ programId }), query: { cursor, limit: 200 } },
      signal,
    }),
  )
}
