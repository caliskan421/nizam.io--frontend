<script setup lang="ts">
// İSKELET yer tutucu (W91): gövdeyi W95 doldurur; prop/emit sözleşmesi `../index`.
import type { DateChangeSnackProps, DateChangeSnackEmits } from '../index'

defineProps<DateChangeSnackProps>()
defineEmits<DateChangeSnackEmits>()
</script>

<template>
  <div data-skeleton="DateChangeSnack" />
</template>
