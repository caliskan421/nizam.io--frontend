<script setup lang="ts">
// İSKELET yer tutucu sayfa (W121): gövdeyi W122 doldurur (06 Arşiv). Rota `/arsiv` bu sayfa
// bağlı olarak çalışır; rota testi bu gövdeye bağlı değildir (KESİN 22). Bağlama noktaları
// `../components/index.ts` başlığında.
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <section data-skeleton="ArchivePage" :aria-label="t('archive.page.title')">
    <h1>{{ t('archive.page.title') }}</h1>
  </section>
</template>
