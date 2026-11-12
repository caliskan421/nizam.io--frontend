<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W123 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { TaskFolderCardsEmits, TaskFolderCardsProps } from '../index'

defineProps<TaskFolderCardsProps>()
defineEmits<TaskFolderCardsEmits>()
</script>

<template>
  <div data-skeleton="TaskFolderCards" />
</template>
