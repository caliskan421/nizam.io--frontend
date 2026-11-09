<script setup lang="ts">
// İSKELET yer tutucu (W91): gövdeyi W92 doldurur; prop/emit sözleşmesi `../index`.
import type { GanttAxisProps } from '../index'

defineProps<GanttAxisProps>()
</script>

<template>
  <div data-skeleton="GanttAxis" />
</template>
