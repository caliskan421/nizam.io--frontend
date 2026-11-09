<script setup lang="ts">
import './panel.css'

import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

import type { TeamRole } from '@/shared/scope/standing-facts'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiSelect } from '@/shared/ui'

import { useProgramDepartmentIndex } from '../../api'
import { can, organizationFacts } from '../../model/capabilities'
import { ROLE_ORDER } from '../../model/memberships'
import type { MembershipLabel } from '../../model/types'
import { COORDINATORSHIPS_ROUTE } from '../../routes'
import { usersText } from './messages'
import { useChipActions } from './use-chip-actions'
import { ROLE_TEXT } from './user-rows'
import UserChip from './UserChip.vue'

/**
 * E-05-32/33 — koordinatörlük çipleri (seçili program). Her işlem anında ve kendi sonucuyla
 * (P12); görünürlük `capabilities.ts` (rol değiştir / çıkar yalnız ŞY ∧ hedef ≠ çağıran). "+ Ekle":
 * seçici `listProgramDepartments` − kişinin birimleri + rol (rol seçici yalnız ŞY); boş liste →
 * K7 "koordinatörlük ekle" yönlendirmesi. Çözülemeyen birim kimliği çizilmez (E-05-20).
 */
const props = defineProps<{ accountId: string; labels: readonly MembershipLabel[] }>()

const store = useScopeStore()
const { standing } = useStanding()
const index = useProgramDepartmentIndex()
const actions = useChipActions(() => props.accountId)

const chips = computed(() =>
  props.labels.flatMap((label) => {
    const name = index.byId.value.get(label.departmentId)?.display_name
    if (!name) return []
    const facts = organizationFacts(standing.value, store.programId, {
      departmentId: label.departmentId,
      accountId: props.accountId,
      targetRole: label.role,
    })
    return [
      {
        label,
        name,
        canChangeRole: can('changeMembershipRole', facts),
        canRemove: can('removeMember', facts),
      },
    ]
  }),
)
const own = computed(() => organizationFacts(standing.value, store.programId, {}))
const canAdd = computed(() => store.programId !== null && can('assignMembership', own.value))
const chooseRole = computed(() => can('chooseMembershipRole', own.value))
const taken = computed(() => new Set(props.labels.map((l) => l.departmentId)))
const options = computed(() =>
  index.departments.value
    .filter((d) => !taken.value.has(d.department_id))
    .map((d) => ({ value: d.department_id, label: d.display_name })),
)
const roleOptions = ROLE_ORDER.map((r) => ({ value: r, label: usersText(ROLE_TEXT[r]) }))

const adding = ref(false)
const department = ref('')
const roleValue = ref<string>('member')
const ROLE_BY_VALUE = new Map<string, TeamRole>(ROLE_ORDER.map((r) => [r, r]))

function startAdd(): void {
  department.value = ''
  roleValue.value = 'member'
  adding.value = true
}

async function submitAdd(): Promise<void> {
  const chosen = (chooseRole.value && ROLE_BY_VALUE.get(roleValue.value)) || 'member'
  if (department.value === '') return
  if (await actions.add(department.value, chosen)) adding.value = false
}
</script>

<template>
  <div class="users-chips" data-testid="user-chips">
    <p class="rp-kicker">{{ usersText('usersPage.panel.chips.title') }}</p>
    <div class="users-chips__list">
      <UserChip
        v-for="chip in chips"
        :key="chip.label.departmentId"
        :data-chip="chip.label.departmentId"
        :name="chip.name"
        :role="chip.label.role"
        :can-change-role="chip.canChangeRole"
        :can-remove="chip.canRemove"
        :busy="actions.pending.value !== null"
        @change-role="actions.changeRole(chip.label.departmentId, $event)"
        @remove="actions.removeChip(chip.label.departmentId)"
      />
      <button
        v-if="canAdd && !adding"
        type="button"
        class="t-btn t-btn--ghost t-btn--sm users-chips__add"
        data-testid="chip-add"
        @click="startAdd"
      >
        + {{ usersText('usersPage.panel.chips.add') }}
      </button>
    </div>
    <div v-if="adding" class="users-chips__form" data-testid="chip-add-form">
      <template v-if="options.length > 0">
        <UiSelect
          v-model="department"
          :options="options"
          :placeholder="usersText('usersPage.panel.chips.departmentPlaceholder')"
          :aria-label="usersText('usersPage.panel.chips.department')"
          data-testid="chip-add-department"
        />
        <UiSelect
          v-if="chooseRole"
          v-model="roleValue"
          :options="roleOptions"
          :aria-label="usersText('usersPage.panel.chips.roleLabel')"
          data-testid="chip-add-role"
        />
        <div class="users-chips__actions">
          <UiButton size="sm" @click="adding = false">
            {{ usersText('usersPage.panel.chips.cancel') }}
          </UiButton>
          <UiButton
            size="sm"
            variant="primary"
            :disabled="department === '' || actions.pending.value !== null"
            data-testid="chip-add-submit"
            @click="submitAdd"
          >
            {{ usersText('usersPage.panel.chips.submit') }}
          </UiButton>
        </div>
      </template>
      <p v-else class="rp-cap" data-testid="chip-add-none">
        {{ usersText('usersPage.panel.chips.none') }}
        <RouterLink :to="{ name: COORDINATORSHIPS_ROUTE.name }">
          {{ usersText('usersPage.panel.chips.goCoordinatorships') }}
        </RouterLink>
      </p>
    </div>
  </div>
</template>
