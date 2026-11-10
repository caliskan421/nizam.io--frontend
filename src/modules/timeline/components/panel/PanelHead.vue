<script setup lang="ts">
import { UiIconButton } from '@/shared/ui'

import { panelText } from './messages'

/** E-03C-54…57 — üst satır ("‹KOD›-— · ‹koordinatörlük›"), başlık, "Liste görünümünde aç", ✕. */
defineProps<{ kicker: string; title: string; titleId: string }>()
const emit = defineEmits<{ close: []; openInList: [] }>()
</script>

<template>
  <div class="tp-head">
    <div class="tp-head__text">
      <p v-if="kicker" class="tp-kicker tp-trunc" data-testid="tp-kicker">{{ kicker }}</p>
      <p :id="titleId" class="tp-title" data-testid="tp-title">{{ title }}</p>
    </div>
    <UiIconButton
      icon="external"
      :label="panelText('openInList')"
      data-testid="tp-open-list"
      @click="emit('openInList')"
    />
    <UiIconButton
      icon="close"
      :label="panelText('close')"
      data-testid="tp-close"
      @click="emit('close')"
    />
  </div>
</template>
