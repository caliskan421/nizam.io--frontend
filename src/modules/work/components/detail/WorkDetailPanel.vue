<script setup lang="ts">
import type { WorkDetailPanelProps, WorkDetailPanelEmits } from '../index'

/** W43 — `WorkDetailPanel` yer tutucusu (W41 iskeleti). Gövde sahibi W43; sözleşme `../index.ts`'te sabit. */
defineProps<WorkDetailPanelProps>()
defineEmits<WorkDetailPanelEmits>()
</script>

<template>
  <!-- W43: WorkDetailPanel gövdesi -->
  <span hidden data-placeholder="WorkDetailPanel" />
</template>
