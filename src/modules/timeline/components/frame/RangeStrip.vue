<script setup lang="ts">
// İSKELET yer tutucu (W91): gövdeyi W93 doldurur; prop/emit sözleşmesi `../index`.
import type { RangeStripProps, RangeStripEmits } from '../index'

defineProps<RangeStripProps>()
defineEmits<RangeStripEmits>()
</script>

<template>
  <div data-skeleton="RangeStrip" />
</template>
