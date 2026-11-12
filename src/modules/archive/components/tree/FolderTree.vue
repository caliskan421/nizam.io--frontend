<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W123 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { FolderTreeEmits, FolderTreeProps } from '../index'

defineProps<FolderTreeProps>()
defineEmits<FolderTreeEmits>()
</script>

<template>
  <div data-skeleton="FolderTree" />
</template>
