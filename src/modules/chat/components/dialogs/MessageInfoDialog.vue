<script setup lang="ts">
/**
 * "Mesaj bilgisi" (E-10-44 → E-10-72…75): yalnız BİREBİR sohbette ve kendi mesajda. Önizleme
 * balonu ("Sen", metin, saat) + karşı tarafın okundu durumu: `seq ≤ peer_read_seq` → "Okundu",
 * değilse "Henüz okunmadı". Grupta pencere AÇILMAZ (BE-028): açılırsa açıklama + stub gösterilir,
 * sahte okuyan listesi üretilmez (§4).
 */
import './dialogs.css'

import { computed } from 'vue'

import { DesignStub, UiAvatar, UiButton, UiHint, UiModal } from '@/shared/ui'

import { useChat } from '../../api/queries'
import { chatText } from '../../messages'
import { useChatPage } from '../../model/context'
import { findMessage } from '../../model/window'

const props = defineProps<{ chatId: string; messageId: string }>()
const emit = defineEmits<{ close: [] }>()

const page = useChatPage()
const chat = useChat(() => props.chatId)
const message = computed(() => findMessage(page.messages.window.value, props.messageId))
const peerRead = computed(() => page.messages.window.value.peerReadSeq)
const isDirect = computed(() => chat.data.value?.kind === 'direct')
const read = computed(() => {
  const seq = message.value?.seq
  return seq !== undefined && peerRead.value !== null && seq <= peerRead.value
})
const time = computed(() => {
  const at = message.value?.created_at
  if (!at) return ''
  const date = new Date(at)
  const clock = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()
  return sameDay
    ? `${chatText('chat.dialogs.msgInfo.today')} ${clock}`
    : `${date.toLocaleDateString('tr-TR')} ${clock}`
})
const peerName = computed(
  () => chat.data.value?.counterpart_name ?? chatText('chat.list.unknownPerson'),
)
</script>

<template>
  <UiModal
    :open="true"
    :title="chatText('chat.dialogs.messageInfo')"
    :description="chat.data.value?.name ?? chat.data.value?.counterpart_name ?? undefined"
    @update:open="emit('close')"
  >
    <div class="chat-dlg" data-testid="dlg-message-info">
      <div v-if="message" class="chat-dlg__bubble" data-testid="dlg-info-bubble">
        <strong>{{ chatText('chat.dialogs.msgInfo.you') }}</strong>
        <span>{{ message.body }}</span>
        <span class="chat-dlg-row__meta">{{ time }}</span>
      </div>
      <template v-if="isDirect && message">
        <p class="chat-dlg-row" data-testid="dlg-read-state">
          <UiAvatar :name="peerName" size="sm" />
          <span class="chat-dlg-row__name">{{ peerName }}</span>
          <span class="chat-dlg-row__meta">
            {{ chatText(read ? 'chat.dialogs.msgInfo.read' : 'chat.dialogs.msgInfo.unread') }}
          </span>
        </p>
        <UiHint>{{ chatText('chat.dialogs.msgInfo.note') }}</UiHint>
      </template>
      <DesignStub v-else id="BE-028" as="div">
        <UiHint data-testid="dlg-who-read">{{ chatText('chat.dialogs.msgInfo.groupSoon') }}</UiHint>
      </DesignStub>
    </div>
    <template #footer>
      <UiButton variant="ghost" @click="emit('close')">
        {{ chatText('chat.dialogs.common.close') }}
      </UiButton>
    </template>
  </UiModal>
</template>
