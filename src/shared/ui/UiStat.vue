<script setup lang="ts">
import './styles/ui.css'

/**
 * İstatistik kartı (`t-stat`): etiket + büyük değer, sağda isteğe bağlı yan alan (`aside` yuvası).
 * Değer yalnız gerçek veridir; veri yoksa çağıran `UiPlaceholder` gösterir (ortak-kurallar §4).
 */
defineProps<{ label: string; value: string | number }>()
</script>

<template>
  <div class="t-stat">
    <div class="t-stat__body">
      <p class="t-stat__label">{{ label }}</p>
      <p class="t-stat__value">{{ value }}</p>
      <slot />
    </div>
    <div v-if="$slots.aside" class="t-stat__aside"><slot name="aside" /></div>
  </div>
</template>
