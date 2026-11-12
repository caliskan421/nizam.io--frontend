<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W122 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { FolderGridEmits, FolderGridProps } from '../index'

defineProps<FolderGridProps>()
defineEmits<FolderGridEmits>()
</script>

<template>
  <div data-skeleton="FolderGrid" />
</template>
