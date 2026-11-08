<script setup lang="ts">
import type { SubtaskBlockProps, SubtaskBlockEmits } from '../index'

/** W44 — `SubtaskBlock` yer tutucusu (W41 iskeleti). Gövde sahibi W44; sözleşme `../index.ts`'te sabit. */
defineProps<SubtaskBlockProps>()
defineEmits<SubtaskBlockEmits>()
</script>

<template>
  <!-- W44: SubtaskBlock gövdesi -->
  <span hidden data-placeholder="SubtaskBlock" />
</template>
