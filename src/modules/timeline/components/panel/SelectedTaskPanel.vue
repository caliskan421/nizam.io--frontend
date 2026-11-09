<script setup lang="ts">
// İSKELET yer tutucu (W91): gövdeyi W94 doldurur; prop/emit sözleşmesi `../index`.
import type { SelectedTaskPanelProps, SelectedTaskPanelEmits } from '../index'

defineProps<SelectedTaskPanelProps>()
defineEmits<SelectedTaskPanelEmits>()
</script>

<template>
  <div data-skeleton="SelectedTaskPanel" />
</template>
