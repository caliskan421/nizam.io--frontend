<script setup lang="ts">
import './detail.css'

import { computed } from 'vue'

import {
  canOwnStatusWorkItem,
  canTransitionWorkItem,
  type WorkActorFacts,
} from '../../model/capabilities'
import type { WorkItem } from '../../model/types'
import StatusMenu from '../forms/StatusMenu.vue'
import { STATUS_DOT } from './format'
import { detailText } from './messages'

/**
 * Durum yeri (E-03-44). Geçiş yetkisi (s.141 `transitionWorkItem` ya da s.142 `ownStatusWorkItem`)
 * varsa durum seçici `StatusMenu` (W45); yoksa — yönetici tek başına dahil — salt okunur durum
 * etiketi. Mercek girdi değildir (P1).
 */
const props = defineProps<{ item: WorkItem; facts: WorkActorFacts }>()
const emit = defineEmits<{ requestEvidence: [] }>()

const canChange = computed(
  () => canTransitionWorkItem(props.facts) || canOwnStatusWorkItem(props.facts),
)
const label = computed(() => detailText(`workDetail.status.${props.item.status}`))
</script>

<template>
  <StatusMenu v-if="canChange" :item="item" @request-evidence="emit('requestEvidence')" />
  <p v-else class="wd-readonly" data-testid="status-readonly">
    <span class="rp-status">
      <span class="rp-dot" :class="`rp-dot--${STATUS_DOT[item.status]}`" aria-hidden="true" />
      <span class="rp-sr">{{ detailText('workDetail.status.label') }}:</span>
      {{ label }}
    </span>
    <span class="rp-cap">{{ detailText('workDetail.status.readonly') }}</span>
  </p>
</template>
