<script setup lang="ts">
import './preview.css'

/** Koyu bant (`data-theme="dark"`): kicker, başlık, vurgu çizgisi, alt satır. */
defineProps<{ kicker: string; title: string; sub?: string; cover?: boolean }>()
</script>

<template>
  <header class="report-band" data-theme="dark">
    <p class="report-kicker">{{ kicker }}</p>
    <h2 class="report-band__title">{{ title }}</h2>
    <span class="report-accent" aria-hidden="true" />
    <p v-if="sub" class="report-band__sub">{{ sub }}</p>
  </header>
</template>
