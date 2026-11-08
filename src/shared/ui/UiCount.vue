<script setup lang="ts">
import './styles/ui.css'

/** Sayaç metni (`rp-count`, mono): sekme ve menü satırlarındaki "(263)" / "3" biçimi. */
withDefaults(defineProps<{ value: number | string; parens?: boolean }>(), { parens: false })
</script>

<template>
  <span class="rp-count">{{ parens ? `(${value})` : value }}</span>
</template>
