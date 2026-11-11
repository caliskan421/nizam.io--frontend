<script setup lang="ts">
import type { Meeting } from '../../model/types'
defineProps<{ items: Meeting[]; hasMore?: boolean; loading?: boolean; error?: boolean }>()
defineEmits<{ close: []; refresh: []; loadMore: [] }>()
</script>

<template><div /></template>
