<script setup lang="ts">
// İSKELET yer tutucu (W71): gövdeyi W74 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { CoordinatorAssignDialogEmits, CoordinatorAssignDialogProps } from '../index'

defineProps<CoordinatorAssignDialogProps>()
defineEmits<CoordinatorAssignDialogEmits>()
</script>

<template>
  <div data-skeleton="CoordinatorAssignDialog" />
</template>
