<script setup lang="ts">
import type { MeetingDetail } from '../../model/types'
defineProps<{ meeting: MeetingDetail }>()
defineEmits<{ add: []; refresh: [] }>()
</script>

<template><div /></template>
