<script setup lang="ts">
/**
 * Grup bilgisi › Sabitli sekmesi (E-10-68, E-10-43): `listChatPins` (en yeni önce; `truncated` →
 * "n+"). Satır → mesaja git (`?mesaj=<seq>`, pencere kapanır). "Sabitlemeyi kaldır" yalnız
 * yetkililerde (`capabilities.pin`) ve ortak onayla; 204 → sabit listesi + mesaj `around` ile
 * tazelenir (veri katmanı).
 */
import './dialogs.css'

import { computed } from 'vue'

import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiEmptyState, UiHint, useToast } from '@/shared/ui'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'

import { useChatPins } from '../../api/queries'
import { useUnpinChatMessage } from '../../api/writes'
import { chatText } from '../../messages'
import type { ChatMessage } from '../../model/types'

const props = defineProps<{ chatId: string; canUnpin: boolean }>()
const emit = defineEmits<{ goto: [message: ChatMessage] }>()

const store = useScopeStore()
const pins = useChatPins(() => props.chatId)
const unpin = useUnpinChatMessage()
const { confirmWrite } = useConfirm()
const toast = useToast()
const items = computed(() => pins.data.value?.items ?? [])

async function remove(message: ChatMessage): Promise<void> {
  const programId = store.programId
  if (programId === null || unpin.isPending.value) return
  const vars = {
    programId,
    chatId: props.chatId,
    messageId: message.message_id,
    seq: message.seq,
  }
  const outcome = await confirmWrite(
    {
      title: chatText('chat.dialogs.pins.removeTitle'),
      body: [chatText('chat.dialogs.pins.removeBody')],
      confirmLabel: chatText('chat.dialogs.pins.remove'),
      tone: 'danger',
    },
    (context) => unpin.submit(vars, { context }),
  )
  if (outcome === null) return
  if (outcome.kind !== 'success') {
    notifyOutcome(outcome)
    return
  }
  toast.push({ message: chatText('chat.dialogs.pins.removed') })
}
</script>

<template>
  <div class="chat-dlg__form" data-testid="dlg-pins">
    <p v-if="pins.isPending.value" role="status">{{ chatText('chat.states.loading') }}</p>
    <UiHint v-else-if="pins.isError.value" error>{{ chatText('chat.states.error') }}</UiHint>
    <UiEmptyState v-else-if="items.length === 0" :title="chatText('chat.dialogs.pins.empty')" />
    <ul v-else class="chat-dlg-list">
      <li v-for="m in items" :key="m.message_id" class="chat-dlg-row chat-dlg-row--split">
        <button type="button" class="chat-dlg-row__main" @click="emit('goto', m)">
          <strong v-if="m.sender_name">{{ m.sender_name }}</strong>
          <span class="rp-trunc">{{ m.body }}</span>
        </button>
        <UiButton v-if="canUnpin" variant="ghost" size="sm" @click="remove(m)">
          {{ chatText('chat.dialogs.pins.remove') }}
        </UiButton>
      </li>
    </ul>
    <UiHint v-if="pins.data.value?.truncated">
      {{ chatText('chat.dialogs.pins.more', { n: items.length }) }}
    </UiHint>
  </div>
</template>
