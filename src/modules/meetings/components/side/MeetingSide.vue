<script setup lang="ts">
import type { MeetingDetail } from '../../model/types'
defineProps<{ meeting: MeetingDetail }>()
defineEmits<{ edit: []; remove: [] }>()
</script>

<template><div /></template>
