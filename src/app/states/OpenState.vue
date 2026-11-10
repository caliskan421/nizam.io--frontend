<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import type { OpenStateName } from '@/app/routes.catalog'
import { UiEmptyState } from '@/shared/ui'

import { openStateCopy } from './open-states'

/**
 * K7 açık durumu (yerinde; URL'siz). Yönetici eylemi: hedef rotaya bağlantı ("program yok" ve
 * "departman yok" → `/programlar`).
 */
const props = defineProps<{ name: OpenStateName; admin: boolean }>()
const copy = computed(() => openStateCopy(props.name, props.admin))
</script>

<template>
  <UiEmptyState
    v-if="copy"
    :title="copy.title"
    :text="copy.text"
    :icon="copy.icon"
    :data-open-state="name"
    data-testid="open-state"
  >
    <template v-if="copy.action" #action>
      <RouterLink
        :to="{ name: copy.action.to }"
        class="t-btn t-btn--primary t-btn--sm"
        data-testid="open-state-action"
      >
        <span class="rp-trunc">{{ copy.action.label }}</span>
      </RouterLink>
    </template>
  </UiEmptyState>
</template>
