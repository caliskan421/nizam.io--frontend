<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W125 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { UploadDialogEmits, UploadDialogProps } from '../index'

defineProps<UploadDialogProps>()
defineEmits<UploadDialogEmits>()
</script>

<template>
  <div data-skeleton="UploadDialog" />
</template>
