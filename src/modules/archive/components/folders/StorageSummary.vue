<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W122 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { StorageSummaryProps } from '../index'

defineProps<StorageSummaryProps>()
</script>

<template>
  <div data-skeleton="StorageSummary" />
</template>
