<script setup lang="ts">
import type { FilesTabProps } from '../index'

/** W46 — `FilesTab` yer tutucusu (W41 iskeleti). Gövde sahibi W46; sözleşme `../index.ts`'te sabit. */
defineProps<FilesTabProps>()
</script>

<template>
  <!-- W46: FilesTab gövdesi -->
  <span hidden data-placeholder="FilesTab" />
</template>
