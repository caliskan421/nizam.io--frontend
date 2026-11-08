<script setup lang="ts">
import ConfirmDialog from './ConfirmDialog.vue'
import { useConfirm } from './use-confirm'

/** Onay kuyruğunun yuvası: kabukta bir kez yerleşir, kuyruğun başını gösterir. */
const { current, accept, cancel } = useConfirm()
</script>

<template>
  <ConfirmDialog
    v-if="current"
    :key="current.id"
    :request="current"
    @accept="accept(current.id)"
    @cancel="cancel(current.id)"
  />
</template>
