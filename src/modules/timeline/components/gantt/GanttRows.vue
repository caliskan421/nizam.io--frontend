<script setup lang="ts">
// İSKELET yer tutucu (W91): gövdeyi W92 doldurur; prop/emit sözleşmesi `../index`.
import type { GanttRowsProps, GanttRowsEmits } from '../index'

defineProps<GanttRowsProps>()
defineEmits<GanttRowsEmits>()
</script>

<template>
  <div data-skeleton="GanttRows" />
</template>
