<script setup lang="ts">
// İSKELET yer tutucu (W71): gövdeyi W73 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { CoordinatorshipDetailEmits, CoordinatorshipDetailProps } from '../index'

defineProps<CoordinatorshipDetailProps>()
defineEmits<CoordinatorshipDetailEmits>()
</script>

<template>
  <div data-skeleton="CoordinatorshipDetail" />
</template>
