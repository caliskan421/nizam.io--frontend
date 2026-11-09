<script setup lang="ts">
// İSKELET yer tutucu (W71): gövdeyi W74 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { UserCreateDialogEmits, UserCreateDialogProps } from '../index'

defineProps<UserCreateDialogProps>()
defineEmits<UserCreateDialogEmits>()
</script>

<template>
  <div data-skeleton="UserCreateDialog" />
</template>
