/** Toplantı yetkileri: pinli meetings README K16, K21, K22, K23, K28–K29, K32, K73–K74. */
import type { Standing } from '@/shared/scope/standing-facts'

export interface MeetingFacts {
  inviteMode: 'coordinatorship' | 'person'
  ownerDepartmentId: string
  departmentIds: readonly string[]
  createdByAccountId: string
  membersIncluded: boolean
  participant: boolean
  viewerRole: 'admin' | 'coordinator' | 'member'
}

export interface NoteFacts {
  authorAccountId: string
  authorRole: string | null
  converted: boolean
}

function meetingVisible(
  admin: boolean,
  hasRow: boolean,
  meeting: MeetingFacts,
  personManager: boolean,
  linked: boolean,
  linkedMember: boolean,
) {
  if (admin) return true
  if (!hasRow) return false
  if (meeting.participant) return true
  return meeting.inviteMode === 'person'
    ? personManager
    : linked || (meeting.membersIncluded && linkedMember)
}

function meetingAccess(standing: Standing | null, programId: string, meeting: MeetingFacts) {
  const coordinatorIds = new Set(
    standing?.rows
      .filter((r) => r.programId === programId && r.role === 'coordinator')
      .map((r) => r.departmentId) ?? [],
  )
  const rows = standing?.rows.filter((r) => r.programId === programId) ?? []
  const admin = standing?.companyAdmin === true
  const linked = meeting.departmentIds.some((id) => coordinatorIds.has(id))
  const personManager =
    standing?.accountId === meeting.createdByAccountId &&
    coordinatorIds.has(meeting.ownerDepartmentId)
  const manager = admin || (meeting.inviteMode === 'person' ? personManager : linked)
  const linkedMember = rows.some(
    (r) => r.role === 'member' && meeting.departmentIds.includes(r.departmentId),
  )
  const visible = meetingVisible(
    admin,
    rows.length > 0,
    meeting,
    personManager,
    linked,
    linkedMember,
  )
  return { admin, coordinatorIds, linked, personManager, manager, visible }
}

/** Mercek yetki girdisi değildir; yalnız seçili programın koordinatörlükleri kullanılır. */
export function meetingCapabilities(
  standing: Standing | null,
  programId: string,
  meeting: MeetingFacts,
) {
  const { admin, coordinatorIds, linked, personManager, manager, visible } = meetingAccess(
    standing,
    programId,
    meeting,
  )
  return {
    visible,
    create: admin || coordinatorIds.size > 0,
    deleted: admin,
    manage: manager,
    manageDepartments: admin && meeting.inviteMode === 'coordinatorship',
    manageParticipants: meeting.inviteMode === 'person' ? admin || personManager : linked,
    editNote(note: NoteFacts) {
      return manager
        ? note.authorRole !== 'member'
        : visible && standing?.accountId === note.authorAccountId && !note.converted
    },
    deleteNote(note: NoteFacts) {
      return manager || (visible && standing?.accountId === note.authorAccountId && !note.converted)
    },
    convertNote(note: NoteFacts) {
      return manager && !note.converted
    },
  }
}
