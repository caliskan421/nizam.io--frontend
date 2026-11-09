<script setup lang="ts">
// İSKELET yer tutucu (W91): gövdeyi W92 doldurur; prop/emit sözleşmesi `../index`.
import type { GanttLinksProps } from '../index'

defineProps<GanttLinksProps>()
</script>

<template>
  <div data-skeleton="GanttLinks" />
</template>
