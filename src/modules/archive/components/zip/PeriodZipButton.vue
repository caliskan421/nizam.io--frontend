<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W126 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { PeriodZipButtonProps } from '../index'

defineProps<PeriodZipButtonProps>()
</script>

<template>
  <div data-skeleton="PeriodZipButton" />
</template>
