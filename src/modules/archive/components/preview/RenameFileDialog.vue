<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W124 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { RenameFileDialogEmits, RenameFileDialogProps } from '../index'

defineProps<RenameFileDialogProps>()
defineEmits<RenameFileDialogEmits>()
</script>

<template>
  <div data-skeleton="RenameFileDialog" />
</template>
