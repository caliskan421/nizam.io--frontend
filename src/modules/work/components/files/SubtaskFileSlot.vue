<script setup lang="ts">
import type { SubtaskFileSlotProps } from '../index'

/** W46 — `SubtaskFileSlot` yer tutucusu (W41 iskeleti). Gövde sahibi W46; sözleşme `../index.ts`'te sabit. */
defineProps<SubtaskFileSlotProps>()
</script>

<template>
  <!-- W46: SubtaskFileSlot gövdesi -->
  <span hidden data-placeholder="SubtaskFileSlot" />
</template>
