<script setup lang="ts">
/**
 * Numaralı yönerge listesi (Engellendi ve iOS ana ekran kartları; `Bildirimler.dc.html` `nb-steps`).
 * Adımlar çağıranın i18n metnidir; bileşen yalnız sıralı liste ve erişim adını verir.
 */
import './push.css'

defineProps<{ label: string; steps: readonly string[] }>()
</script>

<template>
  <ol class="push-steps" :aria-label="label" data-testid="push-steps">
    <li v-for="(step, index) in steps" :key="index" class="push-steps__item">{{ step }}</li>
  </ol>
</template>
