<script setup lang="ts">
import { computed } from 'vue'

import { deletedText } from '../model/messages'

/**
 * Alt bilgi (E-12-38/39): "‹m› / ‹toplam› kayıt gösteriliyor" (toplam = süzgece uyan küme,
 * sunucu `total`; BE-110/117); hepsi yüklendiyse "‹n› kayıt". "Daha fazla yükle" (P4) imleç
 * bitince gizlenir.
 */
const props = defineProps<{
  loaded: number
  total: number | null
  hasMore: boolean
  loadingMore: boolean
}>()
const emit = defineEmits<{ more: [] }>()

const line = computed(() =>
  props.total !== null && props.total !== props.loaded
    ? deletedText('footer.of', { m: props.loaded, n: props.total })
    : deletedText('footer.loaded', { n: props.loaded }),
)
function more(): void {
  if (!props.loadingMore) emit('more')
}
</script>

<template>
  <div class="dr-footer">
    <span class="rp-cap" data-testid="dr-count">{{ line }}</span>
    <button
      v-if="hasMore"
      type="button"
      class="t-btn t-btn--ghost t-btn--sm"
      :aria-disabled="loadingMore ? 'true' : undefined"
      data-testid="dr-more"
      @click="more"
    >
      {{ loadingMore ? deletedText('footer.moreBusy') : deletedText('footer.more') }}
    </button>
  </div>
</template>
