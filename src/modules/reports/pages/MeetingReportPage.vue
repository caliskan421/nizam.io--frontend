<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/**
 * 01g toplantı raporu önizlemesi (`/toplantilar/:meetingId/rapor`) — BOŞ İSKELET (W136: rota ve
 * kapı sözleşmesi). Gövdeyi W138 doldurur; rota/kapı testleri gövdeden bağımsızdır (KESİN 22).
 */
const { t } = useI18n()
</script>

<template>
  <section class="report-page" :aria-label="t('reports.meeting.title')" />
</template>
