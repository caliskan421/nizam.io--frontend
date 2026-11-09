<script setup lang="ts">
// İSKELET yer tutucu (W71): gövdeyi W75 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { UserPanelEmits, UserPanelProps } from '../index'

defineProps<UserPanelProps>()
defineEmits<UserPanelEmits>()
</script>

<template>
  <div data-skeleton="UserPanel" />
</template>
