<script setup lang="ts">
/**
 * "Mesajı ilet" (E-10-42 → E-10-81…85, BE-080): kaynak alıntısı, "Nereye?" hedef seçici
 * (`listChats`, sunucu aramalı; 1–10 benzersiz konuşma), isteğe bağlı not (≤5.000). Gönderim
 * `forwardChatMessage`: hepsi ya da hiçbiri (tek hata, kısmi sonuç yok); `Idempotency-Key` eylem
 * başına bir kez (ağ tekrarı "Yeniden gönder" AYNI anahtar + AYNI gövde). Sonuç yalnız
 * `items[{chat_id,message_id}]`'dır: istemci mesaj uydurmaz; hedef AÇIK sohbetse penceresi gerçek
 * `after` okumasıyla uzlaşır. Kaynak sohbet/gönderen hedefe sızmaz (sunucu `forwarded_from`).
 */
import './dialogs.css'

import { computed, ref } from 'vue'

import { sameScope } from '@/shared/http/mutation'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useScopeStore } from '@/shared/scope/store'
import { UiAvatar, UiButton, UiField, UiHint, UiIcon, UiInput, UiModal } from '@/shared/ui'
import { UiOutcomeNotice } from '@/shared/ui/confirm'

import { useForwardChatMessage } from '../../api/forward'
import { useChat, useChats } from '../../api/queries'
import { chatText } from '../../messages'
import { useChatPage } from '../../model/context'
import {
  FORWARD_NOTE_MAX,
  FORWARD_TARGETS_MAX,
  includesOpenChat,
  toForwardBody,
  validateForward,
  type ForwardError,
} from '../../model/forward'
import type { ChatSummary, ForwardChatMessageResult } from '../../model/types'
import { findMessage } from '../../model/window'
import { chatTitle, isCoordinatorsGroup } from '../list/chat-view'
import { useChatSearch } from '../list/use-chat-search'
import { clockOf } from '../thread/format'
import { useDialogWrite } from './use-dialog-write'

const props = defineProps<{ chatId: string; messageId: string }>()
const emit = defineEmits<{ close: [] }>()

const store = useScopeStore()
const page = useChatPage()
const source = useChat(() => props.chatId)
const search = useChatSearch()
const chats = useChats(search.term)
const forward = useForwardChatMessage()
const write = useDialogWrite()

const selected = ref<string[]>([])
const note = ref('')
const invalid = ref<ForwardError | null>(null)

const pending = computed(() => forward.isPending.value)
const message = computed(() => findMessage(page.messages.window.value, props.messageId))
const quote = computed(() => (message.value?.body ?? '').trim().slice(0, 160))
const description = computed(() =>
  message.value === null
    ? ''
    : chatText('chat.dialogs.forwardForm.description', {
        sender: message.value.sender_name ?? chatText('chat.thread.unknownPerson'),
        chat: source.data.value ? chatTitle(source.data.value) : '',
        time: clockOf(message.value.created_at),
      }),
)
const hasRefs = computed(() => (message.value?.refs.length ?? 0) > 0)

function kindOf(chat: ChatSummary): string {
  if (isCoordinatorsGroup(chat) || chat.auto_kind !== null) {
    return chatText('chat.dialogs.forwardForm.kindSystem')
  }
  return chatText(
    chat.kind === 'group'
      ? 'chat.dialogs.forwardForm.kindGroup'
      : 'chat.dialogs.forwardForm.kindDirect',
  )
}
function toggle(chatId: string): void {
  invalid.value = null
  selected.value = selected.value.includes(chatId)
    ? selected.value.filter((id) => id !== chatId)
    : [...selected.value, chatId]
}

// Gönderimin YAKALANMIŞ kapsamı ("Yeniden gönder" de aynı eyleme aittir).
let submitted: ScopeSnapshot = { ...store.snapshot }

function done(result: ForwardChatMessageResult): void {
  // Açık hedefin penceresi olay içeriğiyle değil gerçek `after` okumasıyla uzlaşır (SSE ayrıca
  // gelir). Gönderim sırasında kapsam değiştiyse sonuç eski kapsama aittir: ekrana okuma açılmaz.
  const same = sameScope(submitted, store.snapshot)
  if (same && includesOpenChat(result, page.chatId())) {
    void page.messages.loadNewer().catch(() => undefined)
  }
  emit('close')
}

async function submit(): Promise<void> {
  invalid.value = validateForward(selected.value, note.value)
  const programId = store.programId
  if (invalid.value !== null || pending.value || programId === null) return
  submitted = { ...store.snapshot }
  const outcome = await forward.submit({
    programId,
    chatId: props.chatId,
    messageId: props.messageId,
    body: toForwardBody(selected.value, note.value),
  })
  write.settle(outcome, done)
}

function resolved(outcome: unknown): void {
  write.settle(outcome as Parameters<typeof write.settle<ForwardChatMessageResult>>[0], done)
}

function setOpen(): void {
  if (!pending.value) emit('close')
}
const errorText = (e: ForwardError | null) =>
  e ? chatText(`chat.dialogs.forwardForm.error.${e}`) : ''
</script>

<template>
  <UiModal
    :open="true"
    :title="chatText('chat.dialogs.forward')"
    :description="description"
    :dismissible="!pending"
    @update:open="setOpen"
  >
    <form id="chat-forward" class="chat-dlg chat-dlg__form" novalidate @submit.prevent="submit">
      <p v-if="quote !== ''" class="chat-dlg__quote" data-testid="dlg-forward-quote">{{ quote }}</p>
      <div class="chat-dlg__group">
        <div class="chat-dlg__row2">
          <span class="chat-dlg__label">{{ chatText('chat.dialogs.forwardForm.where') }}</span>
          <span data-testid="dlg-forward-count">
            {{ chatText('chat.dialogs.forwardForm.selected', { n: selected.length }) }}
            ({{ selected.length }}/{{ FORWARD_TARGETS_MAX }})
          </span>
        </div>
        <UiInput
          v-model="search.text.value"
          type="search"
          icon="search"
          :aria-label="chatText('chat.dialogs.forwardForm.search')"
          :placeholder="chatText('chat.dialogs.forwardForm.search')"
        />
        <p v-if="chats.query.isPending.value" role="status">
          {{ chatText('chat.states.loading') }}
        </p>
        <UiHint v-else-if="chats.query.isError.value" error>{{
          chatText('chat.states.error')
        }}</UiHint>
        <UiHint v-else-if="chats.items.value.length === 0" data-testid="dlg-forward-empty">
          {{ chatText('chat.dialogs.forwardForm.empty') }}
        </UiHint>
        <ul v-else class="chat-dlg-list" data-testid="dlg-forward-list">
          <li v-for="chat in chats.items.value" :key="chat.chat_id">
            <button
              type="button"
              class="chat-dlg-row"
              :aria-pressed="selected.includes(chat.chat_id)"
              :data-chat-id="chat.chat_id"
              @click="toggle(chat.chat_id)"
            >
              <UiAvatar :name="chatTitle(chat)" size="sm" />
              <span class="chat-dlg-row__name">{{ chatTitle(chat) }}</span>
              <span class="chat-dlg-row__meta">{{ kindOf(chat) }}</span>
              <UiIcon v-if="selected.includes(chat.chat_id)" name="check" />
            </button>
          </li>
        </ul>
        <UiButton
          v-if="chats.query.hasNextPage.value"
          variant="ghost"
          size="sm"
          data-testid="dlg-forward-more"
          @click="chats.loadMore()"
        >
          {{ chatText('chat.dialogs.forwardForm.loadMore') }}
        </UiButton>
        <UiHint v-if="invalid === 'targetsRequired' || invalid === 'targetsMax'" error role="alert">
          {{ errorText(invalid) }}
        </UiHint>
      </div>
      <UiField
        :label="chatText('chat.dialogs.forwardForm.note')"
        :error="invalid === 'noteTooLong' ? errorText(invalid) : undefined"
      >
        <UiInput
          v-model="note"
          name="note"
          :aria-label="chatText('chat.dialogs.forwardForm.noteLabel')"
          :placeholder="chatText('chat.dialogs.forwardForm.notePlaceholder')"
        />
      </UiField>
      <UiHint v-if="note.trim().length > FORWARD_NOTE_MAX * 0.9">
        {{
          chatText('chat.dialogs.common.count', { n: note.trim().length, max: FORWARD_NOTE_MAX })
        }}
      </UiHint>
      <UiHint v-if="hasRefs" data-testid="dlg-forward-refs">
        {{ chatText('chat.dialogs.forwardForm.refsNote') }}
      </UiHint>
      <UiHint v-if="write.message.value" error role="alert" data-testid="dlg-error">
        {{ write.message.value }}
      </UiHint>
      <UiOutcomeNotice :outcome="write.notice.value" @resolved="resolved" />
    </form>
    <template #footer>
      <UiButton variant="ghost" :disabled="pending" @click="setOpen">
        {{ chatText('chat.dialogs.common.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        form="chat-forward"
        :disabled="pending"
        data-testid="dlg-submit"
      >
        {{ chatText('chat.dialogs.forwardForm.send') }}
      </UiButton>
    </template>
  </UiModal>
</template>
