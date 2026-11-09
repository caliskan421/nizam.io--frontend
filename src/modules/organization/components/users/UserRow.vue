<script setup lang="ts">
import './users.css'

import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { UiAvatar, UiIconButton } from '@/shared/ui'

import type { ProgramDepartment } from '../../model/types'
import { userLocation } from '../../routes'
import { usersText } from './messages'
import { departmentNames, roleBadges, ROLE_TEXT, type UserRow } from './user-rows'

/**
 * Kullanıcı satırı (E-05-13…21). Seçim kutusu gizli, sütun boş kalır (E-05-14, P7); e-posta
 * satırı çizilmez (E-05-17, BE-041). Ad → 05b; satır ve "Ayrıntı" düğmesi yan paneli açar.
 * Rozetler yalnız gösterim (K1): ilk rol + "+n" (`title` kalan roller); Admin rozeti yok.
 */
const props = defineProps<{
  row: UserRow
  departments: ReadonlyMap<string, ProgramDepartment>
  selected: boolean
}>()
const emit = defineEmits<{ select: [] }>()

const badges = computed(() => roleBadges(props.row))
const names = computed(() => departmentNames(props.row, props.departments))
const restTitle = computed(() => badges.value.rest.map((r) => usersText(ROLE_TEXT[r])).join(', '))
</script>

<template>
  <div
    role="row"
    class="rp-tr rp-tr--body"
    :class="{ 'rp-sel': selected }"
    :aria-selected="selected ? 'true' : 'false'"
    :data-account="row.accountId"
    @click="emit('select')"
  >
    <span role="cell" class="users-row__pick" />
    <span role="cell" class="rp-cellmain">
      <UiAvatar :name="row.fullName" />
      <span class="rp-cellmain__text">
        <RouterLink
          class="rp-title rp-trunc"
          :to="userLocation(row.accountId)"
          :title="usersText('usersPage.table.profile')"
          data-testid="user-name"
          @click.stop
        >
          {{ row.fullName }}
        </RouterLink>
      </span>
    </span>
    <span role="cell" class="users-row__roles">
      <span v-if="badges.first" class="t-badge users-badge" data-testid="role-first">
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
      {{ names.length > 0 ? names.join(', ') : usersText('usersPage.table.unassigned') }}
    </span>
    <span role="cell">
      <UiIconButton
        class="rp-hoveract"
        icon="chevron-right"
        :label="usersText('usersPage.table.open', { name: row.fullName })"
        data-testid="user-open"
        @click.stop="emit('select')"
      />
    </span>
  </div>
</template>
