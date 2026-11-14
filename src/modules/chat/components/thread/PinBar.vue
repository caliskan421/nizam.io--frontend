<script setup lang="ts">
import './thread.css'

import { computed, ref, watch } from 'vue'

import { UiIconButton } from '@/shared/ui'

import { useChatPins } from '../../api/queries'
import { chatText } from '../../messages'
import { useThread } from './use-thread'

/**
 * Sabit mesaj şeridi (E-10-22/23): `listChatPins` (en yeni önce) boş değilse görünür; "Sabitlenen
 * mesaj <i>/<n>" + tek satır gövde. Tık: o mesaja gider (`around`) + odak vurgusu; "Sonraki"
 * istemcide döner. `truncated` → "n+". Sayaç `items.length`dir (toplam sayı yok).
 */
const thread = useThread()
const pins = useChatPins(() => thread.chatId.value)
const items = computed(() => pins.data.value?.items ?? [])
const index = ref(0)
watch(
  () => items.value.length,
  (n) => {
    if (index.value >= n) index.value = 0
  },
)
const current = computed(() => items.value[index.value] ?? null)
const label = computed(() =>
  chatText('chat.thread.pinned', {
    i: index.value + 1,
    n: pins.data.value?.truncated ? `${items.value.length}+` : items.value.length,
  }),
)
const next = () => {
  index.value = (index.value + 1) % Math.max(items.value.length, 1)
}
</script>

<template>
  <div v-if="current" class="chat-pinbar" data-testid="chat-pinbar">
    <span class="chat-pinbar__mark" aria-hidden="true" />
    <button
      type="button"
      class="chat-pinbar__go"
      :title="chatText('chat.thread.pinGo')"
      @click="void thread.goTo(current.seq)"
    >
      <span class="chat-pinbar__label">{{ label }}</span>
      <span class="chat-pinbar__text">{{ current.body }}</span>
    </button>
    <UiIconButton
      v-if="items.length > 1"
      icon="chevron-down"
      :label="chatText('chat.thread.pinNext')"
      @click="next"
    />
  </div>
</template>
