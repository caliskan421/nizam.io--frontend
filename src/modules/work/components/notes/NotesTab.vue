<script setup lang="ts">
import type { NotesTabProps } from '../index'

/** W47 — `NotesTab` yer tutucusu (W41 iskeleti). Gövde sahibi W47; sözleşme `../index.ts`'te sabit. */
defineProps<NotesTabProps>()
</script>

<template>
  <!-- W47: NotesTab gövdesi -->
  <span hidden data-placeholder="NotesTab" />
</template>
