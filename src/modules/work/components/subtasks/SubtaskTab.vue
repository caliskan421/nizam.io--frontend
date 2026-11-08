<script setup lang="ts">
import type { SubtaskTabProps } from '../index'

/** W44 — `SubtaskTab` yer tutucusu (W41 iskeleti). Gövde sahibi W44; sözleşme `../index.ts`'te sabit. */
defineProps<SubtaskTabProps>()
</script>

<template>
  <!-- W44: SubtaskTab gövdesi -->
  <span hidden data-placeholder="SubtaskTab" />
</template>
