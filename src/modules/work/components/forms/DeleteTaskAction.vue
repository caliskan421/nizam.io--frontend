<script setup lang="ts">
import type { DeleteTaskActionProps, DeleteTaskActionEmits } from '../index'

/** W45 — `DeleteTaskAction` yer tutucusu (W41 iskeleti). Gövde sahibi W45; sözleşme `../index.ts`'te sabit. */
defineProps<DeleteTaskActionProps>()
defineEmits<DeleteTaskActionEmits>()
</script>

<template>
  <!-- W45: DeleteTaskAction gövdesi -->
  <span hidden data-placeholder="DeleteTaskAction" />
</template>
