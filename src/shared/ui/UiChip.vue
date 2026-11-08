<script setup lang="ts">
import './styles/ui.css'

import { uiText } from './messages'
import UiIcon from './UiIcon.vue'

/**
 * Çip (`t-chip`). `removable` iken sağda kaldırma düğmesi (`t-chip__x`) `remove` yayar;
 * düğmenin erişim adı `removeLabel` (yoksa "Kaldır").
 */
withDefaults(defineProps<{ removable?: boolean; removeLabel?: string; disabled?: boolean }>(), {
  removable: false,
  removeLabel: undefined,
  disabled: false,
})
const emit = defineEmits<{ remove: [] }>()
</script>

<template>
  <span class="t-chip" :class="{ 't-chip--static': !removable }">
    <span class="rp-trunc"><slot /></span>
    <button
      v-if="removable"
      class="t-chip__x"
      type="button"
      :aria-label="removeLabel ?? uiText('ui.chip.remove')"
      :disabled="disabled"
      @click="emit('remove')"
    >
      <UiIcon name="close" size="sm" />
    </button>
  </span>
</template>
