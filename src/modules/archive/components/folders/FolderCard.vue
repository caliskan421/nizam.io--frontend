<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W122 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { FolderCardEmits, FolderCardProps } from '../index'

defineProps<FolderCardProps>()
defineEmits<FolderCardEmits>()
</script>

<template>
  <div data-skeleton="FolderCard" />
</template>
