<script setup lang="ts">
// İSKELET yer tutucu (W91): gövdeyi W96 doldurur; prop/emit sözleşmesi `../index`.
import type { SubtaskRowsProps } from '../index'

defineProps<SubtaskRowsProps>()
</script>

<template>
  <div data-skeleton="SubtaskRows" />
</template>
