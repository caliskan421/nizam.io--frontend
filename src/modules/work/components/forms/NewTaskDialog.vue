<script setup lang="ts">
import type { NewTaskDialogProps, NewTaskDialogEmits } from '../index'

/** W45 — `NewTaskDialog` yer tutucusu (W41 iskeleti). Gövde sahibi W45; sözleşme `../index.ts`'te sabit. */
defineProps<NewTaskDialogProps>()
defineEmits<NewTaskDialogEmits>()
</script>

<template>
  <!-- W45: NewTaskDialog gövdesi -->
  <span hidden data-placeholder="NewTaskDialog" />
</template>
