<script setup lang="ts">
/**
 * 10c pencerelerin TEK girişi: `request` hangi pencerenin hangi olguyla açıldığını söyler
 * (`model/dialogs.ts`, `open(kind, payload)` sözleşmesi); kapanış (Esc, ✕, Vazgeç, dış tık, eylem
 * sonrası söküm) `close` yayar. Odak (KESİN 27): açılış anındaki odaklı öğe (tetikleyici) saklanır;
 * pencere kapanınca odak ona döner (`UiModal` odak tuzağı), tetikleyici gövdeye düşmüşse (menü
 * kapandı) bağlıysa ona, değilse yazma alanına. Gövdeler `dialogs/` altındadır.
 */
import { nextTick, watch } from 'vue'

import type { DialogRequest } from '../model/dialogs'
import ForwardDialog from './dialogs/ForwardDialog.vue'
import GroupInfoDialog from './dialogs/GroupInfoDialog.vue'
import MessageInfoDialog from './dialogs/MessageInfoDialog.vue'
import NewChatDialog from './dialogs/NewChatDialog.vue'
import PollDialog from './dialogs/PollDialog.vue'
import ShareFileDialog from './dialogs/ShareFileDialog.vue'
import TaskFromMessageDialog from './dialogs/TaskFromMessageDialog.vue'

const props = defineProps<{
  /** Açık pencere isteği; `null` hepsi kapalı. */
  request: DialogRequest | null
}>()

const emit = defineEmits<{
  close: []
}>()

let trigger: HTMLElement | null = null

// Eşzamanlı: pencere çizilmeden önce tetikleyici hâlâ odaktadır.
watch(
  () => props.request,
  (next, previous) => {
    if (next !== null && previous === null) {
      trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    }
    if (next === null && previous !== null) void restoreFocus()
  },
  { flush: 'sync' },
)

async function restoreFocus(): Promise<void> {
  const target = trigger
  trigger = null
  await nextTick()
  const active = document.activeElement
  if (active !== null && active !== document.body) return
  if (target?.isConnected) target.focus()
  else document.querySelector<HTMLElement>('[data-chat-composer-input]')?.focus()
}
</script>

<template>
  <div
    v-if="request !== null"
    class="chat-dialogs"
    :data-dialog="request.dialog"
    data-testid="chat-dialogs"
  >
    <GroupInfoDialog
      v-if="request.dialog === 'groupInfo'"
      :chat-id="request.chatId"
      @close="emit('close')"
    />
    <MessageInfoDialog
      v-else-if="request.dialog === 'messageInfo'"
      :chat-id="request.chatId"
      :message-id="request.messageId"
      @close="emit('close')"
    />
    <NewChatDialog
      v-else-if="request.dialog === 'newGroup'"
      :mode="request.mode"
      @close="emit('close')"
    />
    <ForwardDialog
      v-else-if="request.dialog === 'forward'"
      :chat-id="request.chatId"
      :message-id="request.messageId"
      @close="emit('close')"
    />
    <TaskFromMessageDialog
      v-else-if="request.dialog === 'taskFromMessage'"
      :chat-id="request.chatId"
      :message-id="request.messageId"
      :seq="request.seq"
      @close="emit('close')"
    />
    <PollDialog
      v-else-if="request.dialog === 'poll'"
      :chat-id="request.chatId"
      @close="emit('close')"
    />
    <ShareFileDialog
      v-else-if="request.dialog === 'shareFile'"
      :chat-id="request.chatId"
      :tab="request.tab"
      @close="emit('close')"
    />
  </div>
</template>
