<script setup lang="ts">
import './users.css'

import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { UiAvatar, UiCheck, UiIconButton } from '@/shared/ui'

import type { ProgramDepartment } from '../../model/types'
import { userLocation } from '../../routes'
import { usersText } from './messages'
import { departmentNames, roleBadges, ROLE_TEXT, type UserRow } from './user-rows'
import { injectWorkloadSelection, workloadText } from './use-workload-selection'

/**
 * Kullanıcı satırı (E-05-13…21). Seçim kutusu yalnız iş yükü raporu seçiminde (şirket yöneticisi; E-13-60): `aria-label` "‹ad› rapora ekle", seçili satır vurgulu; programın iş yükünde olmayan hesapta kutu devre dışı + ipucu (E-13-62). Aksi hâlde sütun boş kalır (E-05-14, P7); adın altında
 * e-posta (`KnownUser.email`, E-05-17, BE-041). Ad → 05b; satır ve "Ayrıntı" düğmesi yan paneli
 * açar. Rozetler yalnız gösterim (K1): ilk rol + "+n" (`title` kalan roller); şirket yöneticisi
 * ilk rozet olarak çerçeveli "Admin" (E-05-18, BE-042).
 */
const props = defineProps<{
  row: UserRow
  departments: ReadonlyMap<string, ProgramDepartment>
  selected: boolean
}>()
const emit = defineEmits<{ select: [] }>()

const selection = injectWorkloadSelection()
const pickable = computed(() => selection?.canPick(props.row) !== false)

const badges = computed(() => roleBadges(props.row))
const names = computed(() => departmentNames(props.row, props.departments))
const restTitle = computed(() => badges.value.rest.map((r) => usersText(ROLE_TEXT[r])).join(', '))
</script>

<template>
  <div
    role="row"
    class="rp-tr rp-tr--body"
    :class="{ 'rp-sel': selected || selection?.isSelected(row.accountId) === true }"
    :aria-selected="selected ? 'true' : 'false'"
    :data-account="row.accountId"
    @click="emit('select')"
  >
    <span
      role="cell"
      class="users-row__pick"
      :title="selection?.enabled.value && !pickable ? workloadText('notInWorkload') : undefined"
      @click.stop
    >
      <UiCheck
        v-if="selection?.enabled.value"
        :model-value="selection.isSelected(row.accountId)"
        :label="workloadText('selectRow', { name: row.fullName })"
        :disabled="!pickable"
        :title="pickable ? undefined : workloadText('notInWorkload')"
        data-testid="user-pick"
        @update:model-value="selection.toggle(row.accountId)"
      />
    </span>
    <span role="cell" class="rp-cellmain">
      <UiAvatar :name="row.fullName" />
      <span class="rp-cellmain__text">
        <RouterLink
          class="rp-title rp-trunc"
          :to="userLocation(row.accountId)"
          :title="usersText('users.table.profile')"
          data-testid="user-name"
          @click.stop
        >
          {{ row.fullName }}
        </RouterLink>
        <span class="rp-cap rp-trunc" data-testid="user-email">{{ row.email }}</span>
      </span>
    </span>
    <span role="cell" class="users-row__roles">
      <span
        v-if="badges.first"
        class="t-badge users-badge"
        :class="{ 'users-badge--admin': badges.first === 'admin' }"
        data-testid="role-first"
      >
        {{ usersText(ROLE_TEXT[badges.first]) }}
      </span>
      <span
        v-if="badges.rest.length > 0"
        class="t-badge users-badge users-badge--more"
        :title="restTitle"
        data-testid="role-more"
      >
        +{{ badges.rest.length }}
      </span>
    </span>
    <span
      role="cell"
      class="rp-trunc"
      :class="{ 'rp-faint': names.length === 0 }"
      :title="names.join(', ')"
      data-testid="user-coord"
    >
      {{ names.length > 0 ? names.join(', ') : usersText('users.table.unassigned') }}
    </span>
    <span role="cell">
      <UiIconButton
        class="rp-hoveract"
        icon="chevron-right"
        :label="usersText('users.table.open', { name: row.fullName })"
        data-testid="user-open"
        @click.stop="emit('select')"
      />
    </span>
  </div>
</template>
