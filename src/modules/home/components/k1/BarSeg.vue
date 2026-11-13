<script setup lang="ts">
import { computed } from 'vue'

/**
 * Çubuk dilimi (`rp-bar` içi): genişlik tek dinamik değerdir ve `--rh-w` özel özelliğiyle
 * verilir (satır içi statik stil yok; renk sınıftan, token'dan).
 */
const props = defineProps<{ tone: 'doing' | 'review' | 'late' | 'back' | 'todo'; width: number }>()

const fill = computed(() => ({ '--rh-w': `${Math.max(0, Math.min(100, props.width))}%` }))
</script>

<template>
  <span :class="`rh-seg-${tone}`" :style="fill" :data-seg="tone" />
</template>
