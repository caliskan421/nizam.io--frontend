<script setup lang="ts">
// İSKELET yer tutucu sayfa (W91): gövdeyi W93 doldurur. Rota `/zaman-cizelgesi` bu sayfa
// bağlı olarak çalışır; rota testi bu gövdeye bağlı değildir (KESİN 22).
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <section data-skeleton="TimelinePage" :aria-label="t('timeline.page.title')">
    <h1>{{ t('timeline.page.title') }}</h1>
  </section>
</template>
