<script setup lang="ts">
// İSKELET yer tutucu (W91): gövdeyi W92 doldurur; prop/emit sözleşmesi `../index`.
import type { GanttViewProps, GanttViewEmits } from '../index'

defineProps<GanttViewProps>()
defineEmits<GanttViewEmits>()
</script>

<template>
  <div data-skeleton="GanttView" />
</template>
