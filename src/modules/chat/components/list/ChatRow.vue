<script setup lang="ts">
/**
 * Konuşma satırı (E-10-08…E-10-15): tek `button`; seçili olan `aria-current="true"`. Avatar, ad,
 * zaman, önizleme, sistem grubu iğnesi, sessiz rozeti (`notify_level = none`, BE-027; okunmamış
 * sayacı seviyeden bağımsızdır) ve okunmamış / bahsetme rozeti. Birebirde son mesajım için okundu
 * tiki `peer_read_seq`'ten (BE-082). Süs avatarı erişim adına girmez.
 */
import { computed } from 'vue'

import { UiIcon } from '@/shared/ui'

import { chatText } from '../../messages'
import type { ChatSummary } from '../../model/types'
import {
  avatarOf,
  badgeCount,
  chatTime,
  chatTitle,
  isMuted,
  isSystemGroup,
  listTick,
  previewOf,
} from './chat-view'

const props = defineProps<{
  chat: ChatSummary
  selected: boolean
  /** Koordinatörlük grubunun katalog kodu (yoksa ad baş harfleri). */
  departmentCode?: string
  meAccountId: string | null
  now: Date
  timeZone: string
}>()
defineEmits<{ select: [chatId: string] }>()

const title = computed(() => chatTitle(props.chat))
const avatar = computed(() => avatarOf(props.chat, props.departmentCode))
const time = computed(() =>
  chatTime(
    props.chat.last_message_at,
    props.now,
    props.timeZone,
    chatText('chat.thread.yesterday'),
  ),
)
const preview = computed(() => previewOf(props.chat, props.meAccountId))
const tick = computed(() => listTick(props.chat, props.meAccountId))
const muted = computed(() => isMuted(props.chat))
const unread = computed(() => props.chat.unread_count > 0)
const badged = computed(() => unread.value || props.chat.mentioned)
const badgeLabel = computed(() =>
  props.chat.mentioned
    ? chatText('chat.list.mentionBadge')
    : chatText('chat.list.unreadBadge', { n: props.chat.unread_count }),
)
</script>

<template>
  <button
    type="button"
    class="chat-row"
    :class="{ 'chat-row--unread': unread }"
    :aria-current="selected ? 'true' : undefined"
    :data-chat-id="chat.chat_id"
    @click="$emit('select', chat.chat_id)"
  >
    <span class="chat-av" :class="`chat-av--${avatar.kind}`" aria-hidden="true">
      {{ avatar.text }}
    </span>
    <span class="chat-row__body">
      <span class="chat-row__top">
        <span class="chat-row__name rp-trunc">{{ title }}</span>
        <span v-if="time" class="chat-row__time">{{ time }}</span>
      </span>
      <span class="chat-row__top">
        <span class="chat-row__prev rp-trunc">
          <span
            v-if="tick"
            class="chat-row__tick"
            :class="{ 'chat-row__tick--read': tick === 'read' }"
            data-testid="chat-row-tick"
            role="img"
            :aria-label="
              tick === 'read' ? chatText('chat.thread.read') : chatText('chat.thread.sent')
            "
          >
            <UiIcon :name="tick === 'read' ? 'chat-tick' : 'check'" size="sm" />
          </span>
          <template v-if="preview">{{ preview.prefix }}{{ preview.text }}</template>
        </span>
        <span
          v-if="muted"
          class="chat-row__mute"
          data-testid="chat-row-muted"
          role="img"
          :aria-label="chatText('chat.list.mutedBadge')"
        >
          <UiIcon name="bell" size="sm" />
        </span>
        <span
          v-if="isSystemGroup(chat)"
          class="chat-row__pin"
          role="img"
          :aria-label="chatText('chat.thread.kindSystem')"
        >
          <UiIcon name="pin" size="sm" />
        </span>
        <span v-if="badged" class="chat-row__badge" role="img" :aria-label="badgeLabel">
          {{ chat.mentioned ? '@' : badgeCount(chat.unread_count) }}
        </span>
      </span>
    </span>
  </button>
</template>
