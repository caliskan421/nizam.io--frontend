<script setup lang="ts">
/**
 * "Mesaj bilgisi" (E-10-44 → E-10-72…75): yalnız kendi mesajda. Önizleme balonu ("Sen", metin, saat).
 * Birebirde karşı tarafın okundu durumu `seq ≤ peer_read_seq` ("Okundu"/"Henüz okunmadı"); grupta
 * `listChatMessageReceipts` (BE-028): okuyanlar ve okumayanlar, 200'ü aşarsa `truncated` notu.
 * `last_read_at` "bu mesajı okuma anı" DEĞİLDİR (imlecin son ilerleme anı): hiçbir yerde gösterilmez.
 * Başkasının mesajında istek hiç gönderilmez (sunucu 403 verirdi).
 */
import './dialogs.css'

import { computed } from 'vue'

import { useSessionStore } from '@/shared/session/store'
import { UiAvatar, UiButton, UiHint, UiModal } from '@/shared/ui'

import { useChat } from '../../api/queries'
import { useChatMessageReceipts } from '../../api/shared-queries'
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
const isGroup = computed(() => chat.data.value?.kind === 'group')
const session = useSessionStore()
const mine = computed(
  () => message.value !== null && message.value.sender_account_id === session.accountId,
)
const receipts = useChatMessageReceipts(
  () => props.chatId,
  () => props.messageId,
  () => isGroup.value && mine.value,
)
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
const parts = computed(() => [
  {
    key: 'read',
    title: 'chat.dialogs.msgInfo.readBy' as const,
    people: receipts.data.value?.read ?? [],
  },
  {
    key: 'unread',
    title: 'chat.dialogs.msgInfo.unreadBy' as const,
    people: receipts.data.value?.unread ?? [],
  },
])
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
      <template v-else-if="isGroup && message">
        <UiHint v-if="!mine" error data-testid="dlg-receipts-denied">
          {{ chatText('chat.dialogs.msgInfo.denied') }}
        </UiHint>
        <p v-else-if="receipts.isPending.value" role="status">
          {{ chatText('chat.states.loading') }}
        </p>
        <UiHint v-else-if="receipts.isError.value" error role="alert">
          {{ chatText('chat.states.error') }}
        </UiHint>
        <div v-else data-testid="dlg-who-read">
          <section v-for="part in parts" :key="part.key" :data-testid="`dlg-receipts-${part.key}`">
            <h4 class="chat-dlg__label">{{ chatText(part.title) }}</h4>
            <p v-if="part.people.length === 0" class="chat-dlg-row__meta">
              {{ chatText('chat.dialogs.msgInfo.nobody') }}
            </p>
            <p v-for="p in part.people" :key="p.account_id" class="chat-dlg-row">
              <UiAvatar :name="p.full_name" size="sm" />
              <span class="chat-dlg-row__name">{{ p.full_name }}</span>
            </p>
          </section>
          <UiHint v-if="receipts.data.value?.truncated" data-testid="dlg-receipts-truncated">
            {{ chatText('chat.dialogs.msgInfo.truncated') }}
          </UiHint>
          <UiHint>{{ chatText('chat.dialogs.msgInfo.groupNote') }}</UiHint>
        </div>
      </template>
    </div>
    <template #footer>
      <UiButton variant="ghost" @click="emit('close')">
        {{ chatText('chat.dialogs.common.close') }}
      </UiButton>
    </template>
  </UiModal>
</template>
