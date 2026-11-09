<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'

import type { TeamRole } from '@/shared/scope/standing-facts'
import { UiAvatar, UiIconButton, UiMenu, UiMenuItem } from '@/shared/ui'

import type { RosterMember } from '../../model/types'
import { userLocation } from '../../routes'
import { isCoordinator } from './detail-model'
import { detailText } from './messages'

/**
 * Üyeler sekmesi satırı (E-08-59; P3 minimum): avatar, ad → 05b, rol rozeti, `status = deleted`
 * soluk + "silinmiş". İşlem menüsü yalnız yetkide (`changeMembershipRole` / `removeMember`;
 * kendi satırında gizli — capability `notSelf`) ve etkin satırda.
 */
const props = defineProps<{
  member: RosterMember
  canChangeRole: boolean
  canRemove: boolean
  busy: boolean
}>()
const emit = defineEmits<{ setRole: [role: TeamRole]; remove: [] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const lead = computed(() => isCoordinator(props.member))
const deleted = computed(() => props.member.status === 'deleted')
const hasMenu = computed(() => !deleted.value && (props.canChangeRole || props.canRemove))
const menuLabel = computed(() =>
  detailText('organization.coordinatorship.members.menu', { name: props.member.full_name }),
)

function close(reason: 'escape' | 'tab'): void {
  open.value = false
  if (reason === 'escape') {
    void nextTick(() => root.value?.querySelector<HTMLElement>('[data-action="row-menu"]')?.focus())
  }
}

function onFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (open.value && next && !root.value?.contains(next)) open.value = false
}

function choose(action: 'role' | 'remove'): void {
  open.value = false
  if (action === 'remove') emit('remove')
  else emit('setRole', lead.value ? 'member' : 'coordinator')
}
</script>

<template>
  <li
    ref="root"
    class="cd-member"
    :class="{ 'cd-member--deleted': deleted }"
    :data-member="member.account_id"
    @focusout="onFocusOut"
  >
    <UiAvatar :name="member.full_name" size="sm" />
    <span class="cd-member__text">
      <RouterLink class="rp-title rp-trunc cd-member__name" :to="userLocation(member.account_id)">
        {{ member.full_name }}
      </RouterLink>
      <span v-if="deleted" class="rp-cap" data-deleted>
        {{ detailText('organization.coordinatorship.members.deleted') }}
      </span>
    </span>
    <span class="t-badge cd-badge" :class="{ 'cd-badge--lead': lead }" data-role>
      {{
        lead
          ? detailText('organization.coordinatorship.members.coordinator')
          : detailText('organization.coordinatorship.members.member')
      }}
    </span>
    <span class="cd-member__menu">
      <template v-if="hasMenu">
        <UiIconButton
          icon="more"
          :label="menuLabel"
          :aria-expanded="open ? 'true' : 'false'"
          aria-haspopup="menu"
          :disabled="busy"
          data-action="row-menu"
          @click="open = !open"
        />
        <UiMenu v-if="open" class="cd-pop" :label="menuLabel" @close="close">
          <UiMenuItem v-if="canChangeRole" data-action="role" @select="choose('role')">
            {{
              lead
                ? detailText('organization.coordinatorship.members.makeMember')
                : detailText('organization.coordinatorship.members.makeCoordinator')
            }}
          </UiMenuItem>
          <UiMenuItem v-if="canRemove" danger data-action="remove" @select="choose('remove')">
            {{ detailText('organization.coordinatorship.members.remove') }}
          </UiMenuItem>
        </UiMenu>
      </template>
    </span>
  </li>
</template>
