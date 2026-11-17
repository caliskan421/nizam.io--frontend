<script setup lang="ts">
import './bubble.css'

import { computed } from 'vue'

import { UiIcon } from '@/shared/ui'

import type { ChatMessage } from '../../model/types'
import { chatText } from '../../messages'
import { clockOf } from './format'

/**
 * Mesaj meta satırı (E-10-36/37): sabit iğnesi, "SS:dd", "düzenlendi · SS:dd" ve yalnız kendi
 * mesajımda okundu tiki. Birebirde `seq ≤ peer_read_seq` → renkli çift tik, değilse gri tek tik;
 * grupta yalnız `read_by_all` (BE-028): `true` → "Herkes okudu", `false` → gri tek tik, `null`/yok
 * (bilinmiyor, >200 üye) → tik ÇİZİLMEZ. Tik Mesaj bilgisi penceresini açar (E-10-44).
 */
const props = defineProps<{
  message: ChatMessage
  mine: boolean
  /** Birebir sohbet: karşı tarafın okundu imleci (`null` = grup ya da bilinmiyor). Grupta `read_by_all` kullanılır. */
  peerReadSeq: number | null
  direct: boolean
}>()
const emit = defineEmits<{ info: [] }>()

const time = computed(() =>
  props.message.edited && props.message.edited_at
    ? chatText('chat.thread.edited', { time: clockOf(props.message.edited_at) })
    : clockOf(props.message.created_at),
)
type Tick = 'read' | 'all' | 'sent'
const tick = computed<Tick | null>(() => {
  if (!props.mine) return null
  if (props.direct) {
    return props.peerReadSeq !== null && props.message.seq <= props.peerReadSeq ? 'read' : 'sent'
  }
  const all = props.message.read_by_all
  if (all === undefined || all === null) return null
  return all ? 'all' : 'sent'
})
const tickLabel = computed(() => {
  if (tick.value === 'all') return chatText('chat.thread.allRead')
  return chatText(tick.value === 'read' ? 'chat.thread.read' : 'chat.thread.sent')
})
</script>

<template>
  <span class="chat-bub__meta">
    <span
      v-if="message.pinned_at !== null"
      class="chat-bub__pin"
      role="img"
      :aria-label="chatText('chat.thread.pinMark')"
    >
      <UiIcon name="chat-pin" size="sm" />
    </span>
    <time :datetime="message.created_at">{{ time }}</time>
    <button
      v-if="tick"
      type="button"
      class="chat-tick"
      :class="{ 'chat-tick--read': tick !== 'sent' }"
      :aria-label="tickLabel"
      @click="emit('info')"
    >
      <UiIcon :name="tick === 'sent' ? 'check' : 'chat-tick'" size="sm" />
    </button>
  </span>
</template>
