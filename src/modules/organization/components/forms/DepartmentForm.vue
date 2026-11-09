<script setup lang="ts">
// İSKELET yer tutucu (W71): gövdeyi W74 doldurur; prop/emit sözleşmesi `../index.ts`.
import type { DepartmentFormEmits, DepartmentFormProps } from '../index'

defineProps<DepartmentFormProps>()
defineEmits<DepartmentFormEmits>()
</script>

<template>
  <div data-skeleton="DepartmentForm" />
</template>
