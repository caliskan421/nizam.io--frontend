<script setup lang="ts">
/**
 * Kullanicilar.dc.html'de olup ortak simge setinde (`shared/ui/icons.ts`) bulunmayan simgeler
 * (Dışa aktar, Şifre sıfırlama, Hesabı kilitle, Giriş kilidini kaldır). Görünüm `UiIcon` ile aynı
 * (`t-icon t-icon--sm`); ortak sete taşınması sahiplik dışı öneri olarak raporlandı.
 */
const PATHS = {
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  unlock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 7.5-2',
} as const

defineProps<{ name: keyof typeof PATHS }>()
</script>

<template>
  <svg class="t-icon t-icon--sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path :d="PATHS[name]" />
  </svg>
</template>
