<script setup lang="ts">
import './styles/ui.css'

import UiIcon from './UiIcon.vue'
import type { IconName } from './icons'

/**
 * Boş durum (`rp-empty`): simge, başlık, açıklama ve isteğe bağlı eylem (`action` yuvası).
 * Metinler çağırandan (i18n) gelir; örnek veri gösterilmez.
 */
defineProps<{ title: string; text?: string; icon?: IconName }>()
</script>

<template>
  <div class="rp-empty">
    <UiIcon v-if="icon" :name="icon" size="lg" />
    <p class="rp-empty__title">{{ title }}</p>
    <p v-if="text" class="rp-empty__text">{{ text }}</p>
    <slot name="action" />
  </div>
</template>
