<script setup lang="ts">
import './bubble.css'

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { UiAvatar, UiIcon } from '@/shared/ui'

import type { ChatMessage, ReactionKind } from '../../model/types'
import { chatText } from '../../messages'
import { chatDrafts } from '../composer/drafts'
import BodyText from './BodyText.vue'
import type { MenuAction } from './menu-actions'
import MessageCards from './MessageCards.vue'
import MessageMenu from './MessageMenu.vue'
import MessageMeta from './MessageMeta.vue'
import MessageTasks from './MessageTasks.vue'
import PollCard from './PollCard.vue'
import QuoteBlock from './QuoteBlock.vue'
import ReactionBar from './ReactionBar.vue'
import ReactPicker from './ReactPicker.vue'
import { messageBadge } from '../../model/role-badge'
import { useActions } from './use-actions'
import { useRefSummaries } from './use-ref-summaries'
import { useThread } from './use-thread'

/**
 * Mesaj satırı (E-10-26..28, 36..41): ardışık gruplamada avatar yalnız grubun SON, gönderen adı
 * yalnız grubun İLK mesajında; giden mesaj sağda, avatarsız. Satır araçları (`role="toolbar"`)
 * hover/odak/menü açıkken görünür; dokunmatikte mesaja dokununca açılır (P62). Tek seferde tek
 * menü (`menu` üst bileşende). Kapanınca odak tetikleyiciye döner; satır sökülürse odağı
 * taşıyorsa üst bileşene bildirilir (`focus-lost`, gövdeye düşmez).
 */
const props = defineProps<{
  message: ChatMessage
  mine: boolean
  first: boolean
  last: boolean
  menu: 'react' | 'more' | null
  tools: boolean
}>()
const emit = defineEmits<{
  menu: [kind: 'react' | 'more' | null]
  tools: [open: boolean]
  'focus-lost': []
}>()
const thread = useThread()
const actions = useActions()
const root = ref<HTMLElement | null>(null)
const reactBtn = ref<HTMLButtonElement | null>(null)
const moreBtn = ref<HTMLButtonElement | null>(null)

const summaries = useRefSummaries(() => props.message.refs)
const senderName = computed(
  () =>
    props.message.sender_name ??
    thread.memberName(props.message.sender_account_id) ??
    chatText('chat.thread.unknownPerson'),
)
const busy = computed(() => actions.pending.value.has(props.message.message_id))
const editing = computed(
  () => chatDrafts.getEdit(thread.draftKey.value)?.messageId === props.message.message_id,
)
const focused = computed(() => thread.highlightSeq.value === props.message.seq)
const showName = computed(() => props.first && !props.mine && thread.isGroup.value)
const badge = computed(() => messageBadge(props.message.sender_role, thread.departmentName))

function closeMenu(restore: boolean): void {
  const which = props.menu
  emit('menu', null)
  if (!restore || which === null) return
  void nextTick(() => {
    const trigger = which === 'react' ? reactBtn.value : moreBtn.value
    if (trigger?.isConnected) trigger.focus()
  })
}

function onAction(name: MenuAction): void {
  closeMenu(true)
  const m = props.message
  if (name === 'reply') thread.startReply(m)
  else if (name === 'forward') {
    thread.openDialog({ dialog: 'forward', chatId: thread.chatId.value, messageId: m.message_id })
  } else if (name === 'edit') thread.startEdit(m)
  else if (name === 'pin') void actions.togglePin(m)
  else if (name === 'copy') void actions.copyLink(m)
  else if (name === 'delete') void actions.remove(m)
  else if (name === 'closePoll') void actions.closePoll(m)
  else if (name === 'info') openInfo()
  else
    thread.openDialog({
      dialog: 'taskFromMessage',
      chatId: thread.chatId.value,
      messageId: m.message_id,
      seq: m.seq,
    })
}

function openInfo(): void {
  thread.openDialog({
    dialog: 'messageInfo',
    chatId: thread.chatId.value,
    messageId: props.message.message_id,
  })
}

// Akışın altındaki mesajlarda açılır yüzey (menü / tepki seçici) kaydırma kabında kırpılır; açılınca
// görünür olana dek kaydırılır (KUSUR 9: "Göreve dönüştür"ün altındaki öğeler görünmüyordu).
watch(
  () => props.menu,
  (open) => {
    if (open === null) return
    void nextTick(() =>
      root.value?.querySelector<HTMLElement>('.chat-pop')?.scrollIntoView?.({ block: 'nearest' }),
    )
  },
)

function pick(kind: ReactionKind): void {
  closeMenu(true)
  void actions.react(props.message, kind)
}

function toggleMenu(kind: 'react' | 'more'): void {
  emit('menu', props.menu === kind ? null : kind)
}

const coarse = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(hover: none)').matches

function onRowClick(event: MouseEvent): void {
  if (!coarse()) return
  if ((event.target as HTMLElement).closest('button, a, [role="menu"]')) return
  emit('tools', !props.tools)
}

onBeforeUnmount(() => {
  if (root.value?.contains(document.activeElement)) emit('focus-lost')
})
</script>

<template>
  <div
    ref="root"
    class="msg-row"
    :class="{
      'msg-row--me': mine,
      'msg-row--them': !mine,
      'msg-row--first': first,
      'msg-row--last': last,
      'msg-row--focus': focused,
      'msg-row--edit': editing,
      'msg-row--tools': tools || menu !== null,
    }"
    :data-seq="message.seq"
    :data-message-id="message.message_id"
    data-testid="chat-message"
    @click="onRowClick"
  >
    <span class="msg-row__av" :style="{ visibility: last ? 'visible' : 'hidden' }">
      <UiAvatar v-if="!mine" :name="senderName" />
    </span>
    <div class="msg-row__col">
      <div class="chat-bub">
        <span v-if="showName" class="chat-bub__name">
          {{ senderName }}
          <span
            v-if="badge"
            class="chat-bub__role"
            :title="badge.title"
            data-testid="chat-role-badge"
          >
            {{ badge.text }}
          </span>
        </span>
        <span v-if="message.forwarded_from" class="chat-bub__fwd" data-testid="chat-forwarded">
          <UiIcon name="chat-forward" size="sm" />
          {{ chatText('chat.thread.forwarded') }}
        </span>
        <QuoteBlock v-if="message.reply_to" :quote="message.reply_to" />
        <BodyText v-if="!message.poll" :message="message" :summaries="summaries" />
        <MessageCards :message="message" :summaries="summaries" />
        <PollCard v-if="message.poll" :message="message" />
        <MessageTasks
          v-if="message.task_ids.length > 0"
          :chat-id="thread.chatId.value"
          :message-id="message.message_id"
        />
        <MessageMeta
          :message="message"
          :mine="mine"
          :direct="!thread.isGroup.value"
          :peer-read-seq="thread.peerReadSeq.value"
          @info="openInfo"
        />
      </div>
      <ReactionBar :message="message" :busy="busy" @toggle="pick" />
    </div>
    <div class="msg-row__tools" role="toolbar" :aria-label="chatText('chat.thread.tools')">
      <button
        ref="reactBtn"
        type="button"
        :aria-label="chatText('chat.thread.react')"
        aria-haspopup="menu"
        :aria-expanded="menu === 'react'"
        @click="toggleMenu('react')"
      >
        <UiIcon name="chat-react" size="sm" />
      </button>
      <button
        type="button"
        :aria-label="chatText('chat.thread.reply')"
        @click="thread.startReply(message)"
      >
        <UiIcon name="chat-reply" size="sm" />
      </button>
      <button
        ref="moreBtn"
        type="button"
        :aria-label="chatText('chat.thread.more')"
        aria-haspopup="menu"
        :aria-expanded="menu === 'more'"
        @click="toggleMenu('more')"
      >
        <UiIcon name="more" size="sm" />
      </button>
    </div>
    <ReactPicker
      v-if="menu === 'react'"
      :message="message"
      @pick="pick"
      @close="(r) => closeMenu(r === 'escape')"
    />
    <MessageMenu
      v-if="menu === 'more'"
      :message="message"
      :mine="mine"
      @action="onAction"
      @close="(r) => closeMenu(r === 'escape')"
    />
  </div>
</template>
