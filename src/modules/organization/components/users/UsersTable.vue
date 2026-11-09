<script setup lang="ts">
// İSKELET yer tutucu (W71): gövdeyi W75 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { UsersTableEmits, UsersTableProps } from '../index'

defineProps<UsersTableProps>()
defineEmits<UsersTableEmits>()
</script>

<template>
  <div data-skeleton="UsersTable" />
</template>
