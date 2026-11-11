<script setup lang="ts">
import type { Meeting } from '../../model/types'
defineProps<{ items: Meeting[] }>()
defineEmits<{ close: []; refresh: [] }>()
</script>

<template><div /></template>
