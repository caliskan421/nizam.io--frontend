<script setup lang="ts">
import './panel.css'

import { computed } from 'vue'

import { reachesOwner } from '@/shared/http/mutation'
import type { TeamRole } from '@/shared/scope/standing-facts'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiCheck, useToast } from '@/shared/ui'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'

import { useUpdateUser } from '../../api'
import { can, organizationFacts } from '../../model/capabilities'
import type { MembershipLabel } from '../../model/types'
import { usersText, type UsersTextKey } from './messages'

/**
 * E-05-31 — roller (3 onay kartı). Backend modelinde Admin şirket olgusudur (`company_admin`,
 * satırdan okunur — BE-042), Koordinatör/Üye bir (birim, rol) ekip satırıdır (P12, #13).
 * Admin kartı canlı: `updateUser {company_admin}` (yalnız ŞY, kendi hesabında devre dışı; son
 * yönetici 409 `organization.last_admin` ortak hata metniyle). Değişiklik yetki verdiği/aldığı
 * için istemci onayından geçer (`confirmWrite`). Koordinatör/Üye kartları çiplerden türetilen
 * SALT gösterimdir (devre dışı). Kart tıklaması başka istek atmaz.
 */
const props = defineProps<{
  accountId: string
  companyAdmin: boolean
  labels: readonly MembershipLabel[]
}>()

const store = useScopeStore()
const { standing } = useStanding()
const { confirmWrite } = useConfirm()
const update = useUpdateUser()
// Kurulumda (eşzamanlı) alınır: sökülmüş ekranın geç sonucu bildirim üretmez (Ö-07, W82c).
const toast = useToast()

const roles = computed(() => new Set<TeamRole>(props.labels.map((l) => l.role)))
const canChange = computed(() =>
  can(
    'changeCompanyAdmin',
    organizationFacts(standing.value, store.programId, { accountId: props.accountId }),
  ),
)

async function toggleAdmin(): Promise<void> {
  if (!canChange.value || update.isPending.value) return
  const next = !props.companyAdmin
  const accountId = props.accountId
  const outcome = await confirmWrite(
    {
      title: usersText(
        next ? 'users.panel.adminConfirm.grantTitle' : 'users.panel.adminConfirm.revokeTitle',
      ),
      body: [
        usersText(
          next ? 'users.panel.adminConfirm.grantBody' : 'users.panel.adminConfirm.revokeBody',
        ),
      ],
      confirmLabel: usersText(
        next ? 'users.panel.adminConfirm.grant' : 'users.panel.adminConfirm.revoke',
      ),
      tone: next ? 'primary' : 'danger',
    },
    (context) => update.submit({ accountId, changes: { companyAdmin: next } }, { context }),
  )
  if (outcome === null || !reachesOwner(outcome)) return
  if (outcome.kind === 'success') {
    toast.push({
      message: usersText(
        next ? 'users.panel.adminConfirm.granted' : 'users.panel.adminConfirm.revoked',
      ),
    })
    return
  }
  notifyOutcome(outcome)
}

const DERIVED: readonly { role: TeamRole; label: UsersTextKey; desc: UsersTextKey }[] = [
  {
    role: 'coordinator',
    label: 'users.panel.role.coordinator',
    desc: 'users.panel.role.coordinatorDesc',
  },
  {
    role: 'member',
    label: 'users.panel.role.member',
    desc: 'users.panel.role.memberDesc',
  },
]
</script>

<template>
  <fieldset class="users-roles" data-testid="user-roles">
    <legend class="rp-kicker users-roles__legend">
      {{ usersText('users.panel.rolesTitle') }}
    </legend>
    <label class="users-role" :class="{ 'users-role--on': companyAdmin }" data-role-card="admin">
      <UiCheck
        :disabled="!canChange || update.isPending.value"
        :model-value="companyAdmin"
        @click.prevent="toggleAdmin"
      />
      <span class="users-role__text">
        <span class="users-role__label">{{ usersText('users.panel.role.admin') }}</span>
        <span class="rp-cap">{{ usersText('users.panel.role.adminDesc') }}</span>
      </span>
    </label>
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
    <p class="rp-cap">{{ usersText('users.panel.rolesNote') }}</p>
  </fieldset>
</template>
