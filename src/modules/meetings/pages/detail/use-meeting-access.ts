import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { meetingCapabilities } from '../../model/capabilities'
import type { MeetingDetail } from '../../model/types'

export function useMeetingAccess(source: MaybeRefOrGetter<MeetingDetail | undefined>) {
  const scope = useScopeStore()
  const { standing } = useStanding()
  return computed(() => {
    const m = toValue(source)
    if (!m) return false
    return meetingCapabilities(standing.value, scope.programId ?? '', {
      inviteMode: m.invite_mode,
      ownerDepartmentId: m.owner_department_id,
      departmentIds: m.departments.map((d) => d.department_id),
      createdByAccountId: m.created_by_account_id,
      membersIncluded: m.members_included,
      participant: m.participants.some((p) => p.account_id === standing.value?.accountId),
      viewerRole: m.viewer_role,
    }).manage
  })
}
