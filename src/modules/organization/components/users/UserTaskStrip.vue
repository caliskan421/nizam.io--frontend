<script setup lang="ts">
import './panel.css'

import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { UiIcon } from '@/shared/ui'

import { usePersonWorkItems } from '../../api'
import { userLocation } from '../../routes'
import { usersText } from './messages'
import { taskSummary } from './task-summary'

/**
 * E-05-29 — görev özeti şeridi (açık / geciken / onayda). 05b ile AYNI sorgu: tek
 * `listProgramWorkItems`, sonuna dek sayfalama, kişiye süzme tek yüklemle (`assignedSubset`,
 * KESİN 21). Çekim sürerken "yüklenen kayıtlar içinde"; tık → 05b `kart=acik`.
 */
const props = defineProps<{ accountId: string }>()

const person = usePersonWorkItems(() => props.accountId)
const summary = computed(() => taskSummary(person.items.value))
const ready = computed(() => person.query.data.value !== undefined)
</script>

<template>
  <RouterLink
    class="t-card--inset users-strip"
    :to="userLocation(accountId, { kart: 'acik' })"
    :aria-label="usersText('users.panel.summary.label')"
    data-testid="user-strip"
  >
    <span class="users-strip__cell">
      <span class="rp-kicker">{{ usersText('users.panel.summary.open') }}</span>
      <span class="rp-num" data-testid="strip-open">{{ ready ? summary.open : '—' }}</span>
    </span>
    <span class="users-strip__cell">
      <span class="rp-kicker">{{ usersText('users.panel.summary.overdue') }}</span>
      <span class="rp-num rp-danger-text" data-testid="strip-overdue">
        {{ ready ? summary.overdue : '—' }}
      </span>
    </span>
    <span class="users-strip__cell">
      <span class="rp-kicker">{{ usersText('users.panel.summary.approval') }}</span>
      <span class="rp-num" data-testid="strip-approval">{{ ready ? summary.approval : '—' }}</span>
    </span>
    <UiIcon class="users-strip__go" name="chevron-right" size="sm" />
    <span
      v-if="ready && !person.complete.value"
      class="rp-cap users-strip__partial"
      data-testid="strip-partial"
    >
      {{ usersText('users.panel.summary.partial') }}
    </span>
  </RouterLink>
</template>
