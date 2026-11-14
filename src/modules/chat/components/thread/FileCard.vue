<script setup lang="ts">
import './bubble.css'

import { computed } from 'vue'

import { chatText } from '../../messages'
import { extensionOf, formatSize } from './file-meta'

/**
 * Dosya eki / paylaşılan dosya kartı (E-10-33; P60: kilit yok). `gone` → kesikli çerçeveli "Bu öğe
 * artık yok" kartı (tıklanamaz). Tıklama indirmeyi başlatır (ortak bilet akışı); işlem sürerken
 * kart meşgul.
 */
const props = defineProps<{
  name: string
  size?: number
  gone?: boolean
  busy?: boolean
}>()
defineEmits<{ open: [] }>()
const ext = computed(() => extensionOf(props.name))
</script>

<template>
  <div v-if="gone" class="chat-att chat-att--gone" data-testid="chat-file-gone">
    <span class="chat-att__ic" aria-hidden="true">{{ ext }}</span>
    <span class="chat-att__body">
      <span class="chat-att__name">{{ chatText('chat.thread.gone') }}</span>
    </span>
  </div>
  <button v-else type="button" class="chat-att" :disabled="busy" @click="$emit('open')">
    <span class="chat-att__ic" aria-hidden="true">{{ ext }}</span>
    <span class="chat-att__body">
      <span class="chat-att__name">{{ name }}</span>
      <span v-if="size !== undefined" class="chat-att__meta">{{ formatSize(size) }}</span>
    </span>
  </button>
</template>
