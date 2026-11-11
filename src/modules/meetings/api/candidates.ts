import { fetchRoster, fetchUserPage } from '@/modules/organization/public'
import { sessionBound } from '@/shared/session/query-session'
import { isListTruncated } from '@/shared/http/truncation'
import type { MeetingCandidate, MeetingCandidates } from '../model/types'

/** ŞY: program ekip satırı olan hesapların bütün imleç sayfaları. */
export async function adminCandidates(
  programId: string,
  signal: AbortSignal,
): Promise<MeetingCandidates> {
  const people: MeetingCandidate[] = []
  const seen = new Set<string>()
  let cursor: string | undefined
  let truncated = false
  do {
    const read = sessionBound(({ signal: requestSignal }) =>
      fetchUserPage({ search: null, sortOrder: 'asc', programId }, cursor, requestSignal),
    )
    const result = await read({ signal })
    truncated ||= result.truncated
    for (const user of result.page.users ?? []) {
      if (user.teams.some((team) => team.program_id === programId)) {
        people.push({ accountId: user.account_id, fullName: user.full_name })
      }
    }
    cursor = result.page.next_cursor || undefined
    if (cursor && seen.has(cursor)) throw new Error('Tekrarlanan kullanıcı imleci')
    if (cursor) seen.add(cursor)
  } while (cursor)
  return { people, truncated, partial: truncated }
}

/** K: yalnız yetkili departmanlar; başka departmanlar kapsam dışıdır (BE-067). */
export async function coordinatorCandidates(
  programId: string,
  departmentIds: readonly string[],
  signal: AbortSignal,
): Promise<MeetingCandidates> {
  const people = new Map<string, string>()
  let truncated = false
  for (const departmentId of new Set(departmentIds)) {
    const read = sessionBound(({ signal: requestSignal }) =>
      fetchRoster(programId, departmentId, requestSignal),
    )
    const result = await read({ signal })
    truncated ||= isListTruncated(result)
    for (const member of result.members ?? []) {
      if (member.status === 'active') people.set(member.account_id, member.full_name)
    }
  }
  return {
    people: [...people].map(([accountId, fullName]) => ({ accountId, fullName })),
    truncated,
    partial: true,
  }
}
