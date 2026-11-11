<script setup lang="ts">
import type { MeetingDetail } from '../../model/types'
defineProps<{ meeting: MeetingDetail | null; initialFocus?: 'date' }>()
defineEmits<{ close: []; saved: []; selectPeople: [] }>()
</script>

<template><div /></template>
