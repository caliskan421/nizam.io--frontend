<script setup lang="ts">
import { onMounted, onScopeDispose, ref, useTemplateRef } from 'vue'

import type { ThumbnailQueue } from '../../model/thumbnail-queue'
import type { ArchiveTarget } from '../../model/types'
import ThumbnailImage from './ThumbnailImage.vue'

defineProps<{ target: ArchiveTarget; fileId: string; enqueue: ThumbnailQueue }>()

const frame = useTemplateRef('frame')
const visible = ref(false)
let observer: IntersectionObserver | undefined

onMounted(() => {
  if (!frame.value || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(([entry]) => {
    visible.value = entry?.isIntersecting === true
  })
  observer.observe(frame.value)
})
onScopeDispose(() => observer?.disconnect())
</script>

<template>
  <span ref="frame" class="arch-card__image-frame">
    <ThumbnailImage v-if="visible" :target="target" :file-id="fileId" :enqueue="enqueue" />
  </span>
</template>
