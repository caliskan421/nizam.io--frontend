<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/**
 * 01f dönem sonu raporu önizlemesi (`/arsiv/donem-raporu`) — BOŞ İSKELET (W136: rota ve kapı
 * sözleşmesi). Gövdeyi W138 doldurur; rota/kapı testleri gövdeden bağımsızdır (KESİN 22).
 */
const { t } = useI18n()
</script>

<template>
  <section class="report-page" :aria-label="t('reports.season.title')" />
</template>
