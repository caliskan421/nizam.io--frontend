<script setup lang="ts">
// İSKELET yer tutucu (W71): gövdeyi W74 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { PersonPickerEmits, PersonPickerProps } from '../index'

defineProps<PersonPickerProps>()
defineEmits<PersonPickerEmits>()
</script>

<template>
  <div data-skeleton="PersonPicker" />
</template>
