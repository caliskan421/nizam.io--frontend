<script setup lang="ts">
import { computed } from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiCount, UiErrorState } from '@/shared/ui'

import type { useDepartmentRoster } from '../../api'
import { can, organizationFacts, teamRoleOf } from '../../model/capabilities'
import type { RosterMember } from '../../model/types'
import { teamOrder } from './detail-model'
import { detailText } from './messages'
import MemberRow from './MemberRow.vue'
import { useMemberActions } from './use-member-actions'

/**
 * Üyeler sekmesi (E-08-59; P3 minimum, P17 ortak bileşenler): `listMembers` bütün satırları
 * (koordinatörler önce, sonra ad; silinmiş soluk). "Üye ekle" W74 `MemberAddDialog`. Rol değiştir
 * / çıkar yetkisi satır başına hedef olgularıyla (`organizationFacts` — hedef = çağıran ise
 * gizli, K20). `X-Result-Truncated` → "liste eksik olabilir".
 */
const props = defineProps<{
  departmentId: string
  roster: ReturnType<typeof useDepartmentRoster>
  canAddMember: boolean
}>()
const emit = defineEmits<{ addMember: [] }>()

const store = useScopeStore()
const { standing } = useStanding()
const actions = useMemberActions(() => props.departmentId)

const ready = computed(() => props.roster.query.data.value !== undefined)
const members = computed(() => teamOrder(props.roster.members.value))
const error = computed(() =>
  props.roster.query.isError.value ? toApiError(props.roster.query.error.value) : null,
)

function factsFor(member: RosterMember) {
  return organizationFacts(standing.value, store.programId, {
    departmentId: props.departmentId,
    accountId: member.account_id,
    targetRole: teamRoleOf(member.role),
  })
}
</script>

<template>
  <section class="t-card cd-card cd-members" aria-labelledby="cd-members-title" data-card="members">
    <div class="rp-cardhead cd-cardhead">
      <h2 id="cd-members-title" class="rp-cardtitle">
        {{ detailText('organization.coordinatorship.members.label') }}
        <UiCount v-if="ready" :value="roster.active.value.length" />
      </h2>
      <UiButton
        v-if="canAddMember"
        size="sm"
        icon="user-plus"
        data-action="members-add"
        @click="emit('addMember')"
      >
        {{ detailText('organization.coordinatorship.members.add') }}
      </UiButton>
    </div>
    <UiErrorState
      v-if="error"
      :error="error"
      :title="detailText('organization.coordinatorship.members.error')"
      retryable
      :retrying="roster.query.isFetching.value"
      @retry="roster.query.refetch()"
    />
    <p v-else-if="ready && members.length === 0" class="rp-cap" data-testid="cd-members-empty">
      {{ detailText('organization.coordinatorship.members.empty') }}
    </p>
    <ul v-else class="cd-memberlist" :aria-busy="ready ? undefined : 'true'">
      <MemberRow
        v-for="member in members"
        :key="member.account_id"
        :member="member"
        :can-change-role="can('changeMembershipRole', factsFor(member))"
        :can-remove="can('removeMember', factsFor(member))"
        :busy="actions.busy.value"
        @set-role="actions.setRole(member, $event)"
        @remove="actions.removeMember(member)"
      />
    </ul>
    <p v-if="roster.truncated.value" class="rp-cap" data-members-truncated>
      {{ detailText('organization.coordinatorship.members.truncated') }}
    </p>
  </section>
</template>
