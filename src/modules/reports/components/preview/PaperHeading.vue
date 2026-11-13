<script setup lang="ts">
import './preview.css'

/** Bölüm başlığı (vurgu alt çizgisi) + sağda ikincil bilgi. `id` bölümün `aria-labelledby` bağıdır. */
defineProps<{ id?: string; title: string; aside?: string; level?: 2 | 3 }>()
</script>

<template>
  <div class="report-heading">
    <component :is="level === 2 ? 'h2' : 'h3'" :id="id">{{ title }}</component>
    <span v-if="aside">{{ aside }}</span>
  </div>
</template>
