<script setup lang="ts">
// İSKELET yer tutucu (W71): gövdeyi W74 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { MemberAddDialogEmits, MemberAddDialogProps } from '../index'

defineProps<MemberAddDialogProps>()
defineEmits<MemberAddDialogEmits>()
</script>

<template>
  <div data-skeleton="MemberAddDialog" />
</template>
