<script setup lang="ts">
// İSKELET yer tutucu (W71): gövdeyi W74 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { TemporaryPasswordDialogEmits, TemporaryPasswordDialogProps } from '../index'

defineProps<TemporaryPasswordDialogProps>()
defineEmits<TemporaryPasswordDialogEmits>()
</script>

<template>
  <div data-skeleton="TemporaryPasswordDialog" />
</template>
