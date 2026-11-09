<script setup lang="ts">
import './panel.css'

import { computed } from 'vue'

import type { TeamRole } from '@/shared/scope/standing-facts'
import { DesignStub, UiCheck } from '@/shared/ui'

import type { MembershipLabel } from '../../model/types'
import { usersText, type UsersTextKey } from './messages'

/**
 * E-05-31 — roller (3 onay kartı). Backend modelinde Admin şirket olgusudur, Koordinatör/Üye bir
 * (birim, rol) ekip satırıdır (P12, #13): Admin kartı devre dışı + `designStub('BE-042')` (mevcut
 * değer okunamaz; okumadan yazma güvensiz). Koordinatör/Üye kartları çiplerden türetilen SALT
 * gösterimdir (devre dışı). Kart tıklaması istek atmaz.
 */
const props = defineProps<{ labels: readonly MembershipLabel[] }>()

const roles = computed(() => new Set<TeamRole>(props.labels.map((l) => l.role)))

const DERIVED: readonly { role: TeamRole; label: UsersTextKey; desc: UsersTextKey }[] = [
  {
    role: 'coordinator',
    label: 'usersPage.panel.role.coordinator',
    desc: 'usersPage.panel.role.coordinatorDesc',
  },
  { role: 'member', label: 'usersPage.panel.role.member', desc: 'usersPage.panel.role.memberDesc' },
]
</script>

<template>
  <fieldset class="users-roles" data-testid="user-roles">
    <legend class="rp-kicker users-roles__legend">
      {{ usersText('usersPage.panel.rolesTitle') }}
    </legend>
    <DesignStub id="BE-042" as="div">
      <label class="users-role" data-role-card="admin">
        <UiCheck disabled :model-value="false" />
        <span class="users-role__text">
          <span class="users-role__label">{{ usersText('usersPage.panel.role.admin') }}</span>
          <span class="rp-cap">{{ usersText('usersPage.panel.role.adminDesc') }}</span>
          <span class="rp-cap rp-faint">{{ usersText('usersPage.panel.role.adminUnknown') }}</span>
        </span>
      </label>
    </DesignStub>
    <label
      v-for="card in DERIVED"
      :key="card.role"
      class="users-role"
      :class="{ 'users-role--on': roles.has(card.role) }"
      :data-role-card="card.role"
    >
      <UiCheck disabled :model-value="roles.has(card.role)" />
      <span class="users-role__text">
        <span class="users-role__label">{{ usersText(card.label) }}</span>
        <span class="rp-cap">{{ usersText(card.desc) }}</span>
      </span>
    </label>
    <p class="rp-cap">{{ usersText('usersPage.panel.rolesNote') }}</p>
  </fieldset>
</template>
