<script setup lang="ts">
import type { MeetingNote } from '../../model/types'
defineProps<{ note: MeetingNote }>()
defineEmits<{ close: []; saved: [] }>()
</script>

<template><div /></template>
