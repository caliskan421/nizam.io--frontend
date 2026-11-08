<script setup lang="ts">
import './styles/ui.css'

/** Alan açıklaması / hata metni (`t-hint`, `t-hint--error`). */
withDefaults(defineProps<{ error?: boolean; id?: string }>(), { error: false, id: undefined })
</script>

<template>
  <p :id="id" class="t-hint" :class="{ 't-hint--error': error }"><slot /></p>
</template>
