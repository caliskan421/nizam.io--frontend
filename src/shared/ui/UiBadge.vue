<script setup lang="ts">
import './styles/ui.css'

/**
 * Rozet (`t-badge`). `count` sayaç rozetidir (`t-badge--count`): sayı görünür, anlamı `label`
 * (erişim adı + ipucu) taşır — ör. "3 geciken görev".
 */
withDefaults(
  defineProps<{
    tone?: 'neutral' | 'violet' | 'gold' | 'accent' | 'danger'
    count?: boolean
    label?: string
  }>(),
  { tone: 'neutral', count: false, label: undefined },
)
</script>

<template>
  <span
    class="t-badge"
    :class="{ [`t-badge--${tone}`]: tone !== 'neutral', 't-badge--count': count }"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :title="label"
  >
    <slot />
  </span>
</template>
