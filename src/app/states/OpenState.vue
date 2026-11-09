<script setup lang="ts">
import { computed, useId } from 'vue'
import { RouterLink } from 'vue-router'

import type { OpenStateName } from '@/app/routes.catalog'
import { UiButton, UiEmptyState } from '@/shared/ui'

import { openStateCopy } from './open-states'

/**
 * K7 açık durumu (yerinde; URL'siz). Yönetici eylemi: hedefi canlıysa rota bağlantısı ("program
 * yok" → `/programlar`), değilse devre dışı düğme + faz notu.
 */
const props = defineProps<{ name: OpenStateName; admin: boolean }>()
const copy = computed(() => openStateCopy(props.name, props.admin))
const noteId = `open-state-note-${useId()}`
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
        v-if="copy.action.to"
        :to="{ name: copy.action.to }"
        class="t-btn t-btn--primary t-btn--sm"
        data-testid="open-state-action"
      >
        <span class="rp-trunc">{{ copy.action.label }}</span>
      </RouterLink>
      <template v-else>
        <UiButton variant="primary" size="sm" disabled :aria-describedby="noteId">
          {{ copy.action.label }}
        </UiButton>
        <p :id="noteId" class="shell-state__note">{{ copy.action.note }}</p>
      </template>
    </template>
  </UiEmptyState>
</template>
