<script setup lang="ts">
import type { StatusMenuProps, StatusMenuEmits } from '../index'

/** W45 — `StatusMenu` yer tutucusu (W41 iskeleti). Gövde sahibi W45; sözleşme `../index.ts`'te sabit. */
defineProps<StatusMenuProps>()
defineEmits<StatusMenuEmits>()
</script>

<template>
  <!-- W45: StatusMenu gövdesi -->
  <span hidden data-placeholder="StatusMenu" />
</template>
