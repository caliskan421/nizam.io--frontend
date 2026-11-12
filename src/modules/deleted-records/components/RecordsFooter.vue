<script setup lang="ts">
import { computed } from 'vue'

import { deletedText } from '../model/messages'

/**
 * Alt bilgi (E-12-38/39): "‹n› kayıt yüklendi" (+ "daha var"); süzgeçliyse "‹m› kayıt gösteriliyor
 * (yüklenen ‹n› içinde)". "x / y" biçimi uygulanamaz (toplam yok; BE-110). "Daha fazla yükle" (P4)
 * imleç bitince gizlenir.
 */
const props = defineProps<{
  loaded: number
  shown: number
  filtered: boolean
  hasMore: boolean
  loadingMore: boolean
}>()
const emit = defineEmits<{ more: [] }>()

const line = computed(() => {
  if (props.filtered) return deletedText('footer.shown', { m: props.shown, n: props.loaded })
  return deletedText(props.hasMore ? 'footer.loadedMore' : 'footer.loaded', { n: props.loaded })
})
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
