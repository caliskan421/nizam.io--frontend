<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W122 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { ArchiveSearchBarEmits, ArchiveSearchBarProps } from '../index'

defineProps<ArchiveSearchBarProps>()
defineEmits<ArchiveSearchBarEmits>()
</script>

<template>
  <div data-skeleton="ArchiveSearchBar" />
</template>
