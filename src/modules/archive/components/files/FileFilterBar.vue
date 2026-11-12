<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W123 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { FileFilterBarEmits, FileFilterBarProps } from '../index'

defineProps<FileFilterBarProps>()
defineEmits<FileFilterBarEmits>()
</script>

<template>
  <div data-skeleton="FileFilterBar" />
</template>
