<script setup lang="ts">
import { computed, useId } from 'vue'

import type { OpenStateName } from '@/app/routes.catalog'
import { UiButton, UiEmptyState } from '@/shared/ui'

import { openStateCopy } from './open-states'

/** K7 açık durumu (yerinde; URL'siz). Yönetici eylemi F2'ye kadar devre dışı + faz notu. */
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
      <UiButton variant="primary" size="sm" disabled :aria-describedby="noteId">
        {{ copy.action.label }}
      </UiButton>
      <p :id="noteId" class="shell-state__note">{{ copy.action.note }}</p>
    </template>
  </UiEmptyState>
</template>
