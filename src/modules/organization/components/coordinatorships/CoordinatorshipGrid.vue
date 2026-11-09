<script setup lang="ts">
// İSKELET yer tutucu (W71): gövdeyi W72 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { CoordinatorshipGridEmits, CoordinatorshipGridProps } from '../index'

defineProps<CoordinatorshipGridProps>()
defineEmits<CoordinatorshipGridEmits>()
</script>

<template>
  <div data-skeleton="CoordinatorshipGrid" />
</template>
