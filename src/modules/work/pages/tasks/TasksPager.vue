<script setup lang="ts">
import './tasks.css'

import { computed } from 'vue'

import { designStub } from '@/shared/design-stub'
import { UiButton } from '@/shared/ui'

import { tasksText } from './messages'

/**
 * Sayfalayıcı satırı (E-03-38…40, P4). Numaralı sayfalayıcı ve "sayfa başına" gizli; "‹ilk›–
 * ‹son› / ‹toplam›" kurulmaz (BE-003: toplam yok). Sol: yüklenen sayı — imleç bittiyse kesin
 * toplam, bitmediyse "daha fazlası var" + "yüklenen kayıtlar içinde"; orta: "Daha fazla yükle"
 * (aynı uç, aynı süzgeç, `next_cursor`; fan-out değil §9), imleç bitince gizli.
 */
const props = defineProps<{ loaded: number; hasMore: boolean; loadingMore: boolean }>()
const emit = defineEmits<{ more: [] }>()

const caption = computed(() => {
  if (!props.hasMore) return tasksText('tasksPage.pager.complete', { n: props.loaded })
  const loaded = designStub('BE-003', tasksText('tasksPage.pager.partial', { n: props.loaded }))
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
