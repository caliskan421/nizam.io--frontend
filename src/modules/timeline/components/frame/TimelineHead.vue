<script setup lang="ts">
// İSKELET yer tutucu (W91): gövdeyi W93 doldurur; prop/emit sözleşmesi `../index`.
import type { TimelineHeadProps, TimelineHeadEmits } from '../index'

defineProps<TimelineHeadProps>()
defineEmits<TimelineHeadEmits>()
</script>

<template>
  <div data-skeleton="TimelineHead" />
</template>
