<script setup lang="ts">
import type { Meeting } from '../../model/types'
defineProps<{ items: Meeting[]; complete: boolean }>()
defineEmits<{ create: []; openDeleted: []; select: [id: string] }>()
</script>

<template><div /></template>
