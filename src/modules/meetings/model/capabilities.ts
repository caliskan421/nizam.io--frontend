/** Toplantı yetkileri: pinli meetings README K16, K21, K22, K23, K28–K29, K32, K73–K74. */
import type { Standing } from '@/shared/scope/standing-facts'

export interface MeetingFacts {
  inviteMode: 'coordinatorship' | 'person'
  ownerDepartmentId: string
  departmentIds: readonly string[]
  createdByAccountId: string
}

export interface NoteFacts {
  authorAccountId: string
  authorRole: string | null
  converted: boolean
}

/** Mercek yetki girdisi değildir; yalnız seçili programın koordinatörlükleri kullanılır. */
export function meetingCapabilities(
  standing: Standing | null,
  programId: string,
  meeting: MeetingFacts,
) {
  const coordinatorIds = new Set(
    standing?.rows
      .filter((r) => r.programId === programId && r.role === 'coordinator')
      .map((r) => r.departmentId) ?? [],
  )
  const admin = standing?.companyAdmin === true
  const linked = meeting.departmentIds.some((id) => coordinatorIds.has(id))
  const personManager =
    standing?.accountId === meeting.createdByAccountId &&
    coordinatorIds.has(meeting.ownerDepartmentId)
  const manager = admin || (meeting.inviteMode === 'person' ? personManager : linked)
  return {
    create: admin || coordinatorIds.size > 0,
    deleted: admin,
    manage: manager,
    manageDepartments: admin && meeting.inviteMode === 'coordinatorship',
    manageParticipants: meeting.inviteMode === 'person' ? admin || personManager : linked,
    editNote(note: NoteFacts) {
      return manager
        ? note.authorRole !== 'member'
        : standing?.accountId === note.authorAccountId && !note.converted
    },
    deleteNote(note: NoteFacts) {
      return manager || (standing?.accountId === note.authorAccountId && !note.converted)
    },
    convertNote(note: NoteFacts) {
      return manager && !note.converted
    },
  }
}
