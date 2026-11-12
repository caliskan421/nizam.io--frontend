<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W123 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { FileListEmits, FileListProps } from '../index'

defineProps<FileListProps>()
defineEmits<FileListEmits>()
</script>

<template>
  <div data-skeleton="FileList" />
</template>
