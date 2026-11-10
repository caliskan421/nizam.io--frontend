<script setup lang="ts">
import './tasks.css'

import { computed } from 'vue'

import { UiButton } from '@/shared/ui'

import { tasksText } from './messages'

/**
 * Sayfalayıcı satırı (E-03-38…40, P4). Numaralı sayfalayıcı ve "sayfa başına" gizli (imleçli
 * uç: sayfa numarası yok); "‹ilk›–‹son› / ‹toplam›" kurulmaz. Sol: imleç bittiyse kesin toplam;
 * bitmediyse sunucu toplamı biliniyorsa "‹n› / ‹toplam› görev yüklendi" (`countProgramWorkItems`,
 * BE-003), bilinmiyorsa "daha fazlası var" + "yüklenen kayıtlar içinde"; orta: "Daha fazla yükle"
 * (aynı uç, aynı süzgeç, `next_cursor`; fan-out değil §9), imleç bitince gizli.
 */
const props = defineProps<{
  loaded: number
  hasMore: boolean
  loadingMore: boolean
  /** Sunucu toplamı (sayaç ucu); bilinmiyorsa `null`/verilmez. */
  total?: number | null
}>()
const emit = defineEmits<{ more: [] }>()

const caption = computed(() => {
  if (!props.hasMore) return tasksText('tasksPage.pager.complete', { n: props.loaded })
  if (props.total != null) {
    return tasksText('tasksPage.pager.loadedOfTotal', { n: props.loaded, total: props.total })
  }
  const loaded = tasksText('tasksPage.pager.partial', { n: props.loaded })
  return `${loaded} · ${tasksText('tasksPage.partial')}`
})
</script>

<template>
  <div class="tasks-pager">
    <span class="rp-cap rp-trunc" data-testid="pager-caption">{{ caption }}</span>
    <UiButton
      v-if="hasMore"
      size="sm"
      :disabled="loadingMore"
      data-testid="load-more"
      @click="emit('more')"
    >
      {{ tasksText(loadingMore ? 'tasksPage.pager.loadingMore' : 'tasksPage.pager.more') }}
    </UiButton>
    <span v-else aria-hidden="true" />
    <span aria-hidden="true" />
  </div>
</template>
