<script setup lang="ts">
// İSKELET yer tutucu (W91): gövdeyi W92 doldurur; prop/emit sözleşmesi `../index`.
import type { GanttBarsProps, GanttBarsEmits } from '../index'

defineProps<GanttBarsProps>()
defineEmits<GanttBarsEmits>()
</script>

<template>
  <div data-skeleton="GanttBars" />
</template>
