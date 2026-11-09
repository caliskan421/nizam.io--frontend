<script setup lang="ts">
// İSKELET yer tutucu (W91): gövdeyi W93 doldurur; prop/emit sözleşmesi `../index`.
import type { TimelineToolbarProps, TimelineToolbarEmits } from '../index'

defineProps<TimelineToolbarProps>()
defineEmits<TimelineToolbarEmits>()
</script>

<template>
  <div data-skeleton="TimelineToolbar" />
</template>
