<script setup lang="ts">
import './styles/ui.css'

import { ICONS, type IconName } from './icons'

/** Çizgi simge (`t-icon`). Süs simgesidir: erişim adı simgeyi taşıyan denetimde durur. */
withDefaults(defineProps<{ name: IconName; size?: 'sm' | 'md' | 'lg'; bold?: boolean }>(), {
  size: 'md',
  bold: false,
})
</script>

<template>
  <svg
    class="t-icon"
    :class="{ [`t-icon--${size}`]: size !== 'md', 't-icon--bold': bold }"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="ICONS[name]" />
  </svg>
</template>
