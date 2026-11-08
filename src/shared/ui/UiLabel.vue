<script setup lang="ts">
import './styles/ui.css'

/** Alan etiketi (`t-label`). */
defineProps<{ for?: string }>()
</script>

<template>
  <label class="t-label" :for="$props.for"><slot /></label>
</template>
