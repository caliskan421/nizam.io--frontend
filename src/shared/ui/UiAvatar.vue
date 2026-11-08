<script setup lang="ts">
import './styles/ui.css'

import { computed } from 'vue'

/**
 * Baş harf avatarı (`rp-av`): ilk iki sözcüğün ilk harfleri, `tr-TR` büyük harf (i → İ).
 * Fotoğraf yok. Ad yanında yazılı olduğundan süs öğesidir (`aria-hidden`).
 */
const props = withDefaults(defineProps<{ name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }>(), {
  size: 'md',
})

const initials = computed(() =>
  props.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toLocaleUpperCase('tr-TR'),
)
</script>

<template>
  <span class="rp-av" :class="{ [`rp-av--${size}`]: size !== 'md' }" aria-hidden="true">
    {{ initials }}
  </span>
</template>
