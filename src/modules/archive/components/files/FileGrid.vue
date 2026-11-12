<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W123 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { FileGridEmits, FileGridProps } from '../index'

defineProps<FileGridProps>()
defineEmits<FileGridEmits>()
</script>

<template>
  <div data-skeleton="FileGrid" />
</template>
