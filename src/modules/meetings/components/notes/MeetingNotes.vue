<script setup lang="ts">
import type { MeetingDetail, MeetingNote } from '../../model/types'
defineProps<{ meeting: MeetingDetail }>()
defineEmits<{ convert: [note: MeetingNote]; refresh: [] }>()
</script>

<template><div /></template>
