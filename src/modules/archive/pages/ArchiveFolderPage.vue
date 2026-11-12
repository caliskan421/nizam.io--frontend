<script setup lang="ts">
// İSKELET yer tutucu sayfa (W121): gövdeyi W123 doldurur (07 Arşiv › Klasör). Rota
// `/arsiv/:klasorId` bu sayfa bağlı olarak çalışır; rota testi bu gövdeye bağlı değildir
// (KESİN 22). Bağlama noktaları `../components/index.ts` başlığında.
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <section data-skeleton="ArchiveFolderPage" :aria-label="t('archive.folder.title')">
    <h1>{{ t('archive.folder.title') }}</h1>
  </section>
</template>
