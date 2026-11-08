<script setup lang="ts">
import './styles/ui.css'

import UiIcon from './UiIcon.vue'
import type { IconName } from './icons'

/**
 * Simge düğmesi (`t-iconbtn`). Görünür metin olmadığından `label` zorunludur: erişim adı ve
 * ipucu (`aria-label` + `title`) olur.
 */
withDefaults(
  defineProps<{
    icon: IconName
    label: string
    size?: 'sm' | 'md'
    tone?: 'default' | 'danger' | 'accent'
    round?: boolean
    disabled?: boolean
    iconSize?: 'sm' | 'md'
    type?: 'button' | 'submit'
  }>(),
  { size: 'sm', tone: 'default', round: false, disabled: false, iconSize: 'sm', type: 'button' },
)
</script>

<template>
  <button
    class="t-iconbtn"
    :class="{
      't-iconbtn--md': size === 'md',
      [`t-iconbtn--${tone}`]: tone !== 'default',
      't-iconbtn--round': round,
    }"
    :type="type"
    :aria-label="label"
    :title="label"
    :disabled="disabled"
  >
    <UiIcon :name="icon" :size="iconSize" />
    <slot />
  </button>
</template>
