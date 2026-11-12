<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W124 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { FilePreviewEmits, FilePreviewProps } from '../index'

defineProps<FilePreviewProps>()
defineEmits<FilePreviewEmits>()
</script>

<template>
  <div data-skeleton="FilePreview" />
</template>
