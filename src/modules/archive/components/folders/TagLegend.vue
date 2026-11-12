<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W122 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { TagLegendEmits, TagLegendProps } from '../index'

defineProps<TagLegendProps>()
defineEmits<TagLegendEmits>()
</script>

<template>
  <div data-skeleton="TagLegend" />
</template>
