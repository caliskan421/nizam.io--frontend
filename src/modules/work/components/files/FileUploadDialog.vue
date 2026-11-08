<script setup lang="ts">
import type { FileUploadDialogProps, FileUploadDialogEmits } from '../index'

/** W46 — `FileUploadDialog` yer tutucusu (W41 iskeleti). Gövde sahibi W46; sözleşme `../index.ts`'te sabit. */
defineProps<FileUploadDialogProps>()
defineEmits<FileUploadDialogEmits>()
</script>

<template>
  <!-- W46: FileUploadDialog gövdesi -->
  <span hidden data-placeholder="FileUploadDialog" />
</template>
