<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W124 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { FileActionsEmits, FileActionsProps } from '../index'

defineProps<FileActionsProps>()
defineEmits<FileActionsEmits>()
</script>

<template>
  <div data-skeleton="FileActions" />
</template>
