<script setup lang="ts">
import './thread.css'

import { computed } from 'vue'

import { UiIconButton } from '@/shared/ui'

import { useChatPage } from '../../model/context'
import { chatText } from '../../messages'
import { avatarText } from './avatar'
import { useThread } from './use-thread'

/**
 * Konuşma başlığı (E-10-18..20): avatar + ad düğmesi (Grup/konuşma bilgisi penceresini açar) ve ⓘ;
 * alt satır "<Ad> yazıyor…" (SSE `typing`; çoklu yazanda "<n> kişi yazıyor…") ya da tür
 * ("Sistem grubu" / "Grup" / "Birebir"). Dar ekranda Geri düğmesi sayfa sahibindedir (`ChatPage`, başlık üstü). Çevrimiçi/son
 * görülme çizilmez (tasarımda yok).
 */
const thread = useThread()
const page = useChatPage()

const chat = computed(() => thread.chat.value)
const title = computed(() => chat.value?.name ?? chat.value?.counterpart_name ?? '')
const avatar = computed(() => {
  const c = chat.value
  if (!c) return ''
  const id = c.source_department_id
  return avatarText({
    chat: c,
    departmentCode: id ? thread.departmentCode(id) : null,
    departmentName: id ? thread.departmentName(id) : null,
  })
})
const typingNames = computed(() =>
  page
    .typingAccountIds()
    .map((id) => thread.memberName(id)?.split(/\s+/)[0] ?? null)
    .filter((name): name is string => name !== null),
)
const sub = computed(() => {
  const ids = page.typingAccountIds()
  if (ids.length === 1 && typingNames.value[0]) {
    return chatText('chat.thread.typing', { name: typingNames.value[0] })
  }
  if (ids.length > 0) return chatText('chat.thread.typingMany', { n: ids.length })
  const c = chat.value
  if (!c) return ''
  if (c.auto_kind !== null) return chatText('chat.thread.kindSystem')
  return c.kind === 'group' ? chatText('chat.thread.kindGroup') : chatText('chat.thread.kindDirect')
})

function info(): void {
  thread.openDialog({ dialog: 'groupInfo', chatId: thread.chatId.value })
}
</script>

<template>
  <header class="chat-thread__head">
    <button
      type="button"
      class="chat-thread__who"
      :aria-label="chatText('chat.thread.info', { name: title })"
      @click="info"
    >
      <span class="chat-thread__avatar" aria-hidden="true">{{ avatar }}</span>
      <span class="chat-thread__title">
        <strong>{{ title }}</strong>
        <span class="chat-thread__sub">{{ sub }}</span>
      </span>
    </button>
    <span class="chat-thread__grow" />
    <UiIconButton
      icon="chat-info"
      :label="chatText('chat.thread.info', { name: title })"
      @click="info"
    />
  </header>
</template>
