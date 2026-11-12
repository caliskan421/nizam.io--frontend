<script setup lang="ts">
import './files.css'

import { computed } from 'vue'

import { cssVar } from '@/shared/tokens/css-var'

import { tagView } from '../../model/tags'

/** Etiket noktası (E-06-43): P34 renk sözlüğü; bilinmeyen etiket nötr, adı `title`'da. */
const props = defineProps<{ tag: string; card?: boolean }>()
const view = computed(() => tagView(props.tag))
</script>

<template>
  <span
    class="arch-dot"
    :class="{ 'arch-dot--card': card }"
    :style="{ background: cssVar(view.tone) }"
    :title="view.label"
    :data-tag-dot="tag"
    role="img"
    :aria-label="view.label"
  />
</template>
