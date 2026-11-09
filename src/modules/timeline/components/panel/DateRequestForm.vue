<script setup lang="ts">
// İSKELET yer tutucu (W91): gövdeyi W94 doldurur; prop/emit sözleşmesi `../index`.
import type { DateRequestFormProps, DateRequestFormEmits } from '../index'

defineProps<DateRequestFormProps>()
defineEmits<DateRequestFormEmits>()
</script>

<template>
  <div data-skeleton="DateRequestForm" />
</template>
