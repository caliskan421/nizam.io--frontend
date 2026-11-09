<script setup lang="ts">
// İSKELET yer tutucu (W71): gövdeyi W72 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { CoordinatorshipCardEmits, CoordinatorshipCardProps } from '../index'

defineProps<CoordinatorshipCardProps>()
defineEmits<CoordinatorshipCardEmits>()
</script>

<template>
  <div data-skeleton="CoordinatorshipCard" />
</template>
