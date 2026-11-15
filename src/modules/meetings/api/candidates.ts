import { programHeaders } from '@/modules/work/public'
import { api, unwrap } from '@/shared/http'
import { sessionBound } from '@/shared/session/query-session'
import type { MeetingCandidate, MeetingCandidates } from '../model/types'

/** Kimlik sırasıyla (sayfa sırası) tekrar eden imleç sonsuz döngüyü önlemek için hata sayılır. */
const PAGE_LIMIT = 200

/**
 * Katılımcı adayları (BE-067, `listMeetingParticipantCandidates`, S2): kuruluş kapısı
 * (`meetingId` yok) ya da var olan toplantıya ekleme yetkisi sunucu kararıdır. Kısa/boş sayfa
 * `next_cursor` taşıyabilir; imleç boşalana dek ilerlenir. Ad sırası istemcidedir.
 */
export async function fetchMeetingCandidates(
  programId: string,
  meetingId: string | null,
  signal: AbortSignal,
): Promise<MeetingCandidates> {
  const people = new Map<string, MeetingCandidate>()
  const seen = new Set<string>()
  let cursor: string | undefined
  do {
    signal.throwIfAborted()
    const read = sessionBound(({ signal: requestSignal }) =>
      unwrap(
        api.GET('/v1/meetings/participant-candidates', {
          params: {
            header: programHeaders({ programId }),
            query: { meeting_id: meetingId ?? undefined, cursor, limit: PAGE_LIMIT },
          },
          signal: requestSignal,
        }),
      ),
    )
    const page = await read({ signal })
    for (const item of page.items) {
      people.set(item.account_id, {
        accountId: item.account_id,
        fullName: item.full_name,
        isParticipant: item.is_participant,
      })
    }
    cursor = page.next_cursor || undefined
    if (cursor && seen.has(cursor)) throw new Error('Tekrarlanan aday imleci')
    if (cursor) seen.add(cursor)
  } while (cursor)
  return {
    people: [...people.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr-TR')),
  }
}
