<script setup lang="ts">
import { ref, watch } from 'vue'

import type { ThumbnailQueue } from '../../model/thumbnail-queue'
import { useFileThumbnail } from '../../api/thumbnails'
import type { ArchiveTarget } from '../../model/types'

const props = defineProps<{ target: ArchiveTarget; fileId: string; enqueue: ThumbnailQueue }>()
const { url } = useFileThumbnail(
  () => props.target,
  () => props.fileId,
  props.enqueue,
)
const failed = ref(false)
watch(url, () => {
  failed.value = false
})
</script>

<template>
  <img
    v-if="url && !failed"
    :src="url"
    class="arch-card__image"
    alt=""
    decoding="async"
    @error="failed = true"
  />
</template>
