<script setup lang="ts">
import { UiIcon, UiIconButton } from '@/shared/ui'

import { sideText } from './messages'

/** Marka satırı (E-00-01…03): logo (süs), sabit ürün adı (P9), derleme sürümü, daraltma. */
defineProps<{ version: string | null }>()
const emit = defineEmits<{ collapse: [] }>()
</script>

<template>
  <div class="side-brand">
    <span class="side-logo" aria-hidden="true"><UiIcon name="rocket" bold /></span>
    <span class="side-brand__text">
      <span class="side-brand__name rp-trunc">{{ sideText('side.brand') }}</span>
      <span v-if="version" class="side-brand__ver" data-testid="side-version">{{ version }}</span>
    </span>
    <UiIconButton
      icon="panel-collapse"
      :label="sideText('side.collapse')"
      @click="emit('collapse')"
    />
  </div>
</template>
