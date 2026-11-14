<script setup lang="ts">
import './bubble.css'

import { computed } from 'vue'

import { UiIcon } from '@/shared/ui'

import type { ChatMessage } from '../../model/types'
import { chatText } from '../../messages'
import { clockOf } from './format'

/**
 * Mesaj meta satırı (E-10-36/37): sabit iğnesi, "SS:dd", "düzenlendi · SS:dd" ve — yalnız BİREBİRDE,
 * yalnız kendi mesajımda — okundu tiki (`seq ≤ peer_read_seq` → renkli çift tik, değilse gri tek
 * tik; `aria-label` "Okundu"/"Gönderildi"). Grupta tik YOKTUR (kim okudu BE-028, kayıtlı eksik).
 * Birebir tik, Mesaj bilgisi penceresini açar (E-10-44).
 */
const props = defineProps<{
  message: ChatMessage
  mine: boolean
  /** Birebir sohbet: karşı tarafın okundu imleci (`null` = grup ya da bilinmiyor). */
  peerReadSeq: number | null
  direct: boolean
}>()
const emit = defineEmits<{ info: [] }>()

const time = computed(() =>
  props.message.edited && props.message.edited_at
    ? chatText('chat.thread.edited', { time: clockOf(props.message.edited_at) })
    : clockOf(props.message.created_at),
)
const showTick = computed(() => props.mine && props.direct)
const read = computed(() => props.peerReadSeq !== null && props.message.seq <= props.peerReadSeq)
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
      v-if="showTick"
      type="button"
      class="chat-tick"
      :class="{ 'chat-tick--read': read }"
      :aria-label="read ? chatText('chat.thread.read') : chatText('chat.thread.sent')"
      @click="emit('info')"
    >
      <UiIcon :name="read ? 'chat-tick' : 'check'" size="sm" />
    </button>
  </span>
</template>
