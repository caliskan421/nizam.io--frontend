<script setup lang="ts">
// İSKELET yer tutucu (W121): gövdeyi W126 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { FolderZipButtonProps } from '../index'

defineProps<FolderZipButtonProps>()
</script>

<template>
  <div data-skeleton="FolderZipButton" />
</template>
