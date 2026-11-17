<script setup lang="ts">
import './bubble.css'

import { computed } from 'vue'

import { DesignStub, UiMenu, UiMenuItem } from '@/shared/ui'

import { messageFacts } from '../../model/capabilities'
import { CHAT_STUBS } from '../../model/stubs'
import type { ChatMessage } from '../../model/types'
import { chatText } from '../../messages'
import type { MenuAction } from './menu-actions'
import { useThread } from './use-thread'

/**
 * Mesaj menüsü (E-10-41): Yanıtla, İlet (devre dışı — BE-080; `forward` eylemi W185b'ye hazır
 * kapıdır), Sabitle / Sabitlemeyi kaldır, Mesaj bilgisi (yalnız kendi mesajım; birebirde ve grupta
 * pencere açılır, BE-028 — sunucu başkasının mesajında 403 verir), Bağlantıyı
 * kopyala, Düzenle, Sil, Göreve dönüştür, Anketi bitir. Koşullu öğeler yetkisizde DOM'da yoktur
 * (`chatCapabilities`; gizleme güvenlik değildir, sunucu her istekte denetler).
 */
const props = defineProps<{ message: ChatMessage; mine: boolean }>()
const emit = defineEmits<{
  close: [reason: 'escape' | 'tab']
  action: [name: MenuAction]
}>()
const thread = useThread()
const facts = computed(() => messageFacts(props.message))
const caps = computed(() => thread.caps.value)
const pinned = computed(() => props.message.pinned_at !== null)
</script>

<template>
  <UiMenu
    class="chat-pop chat-pop--more"
    :label="chatText('chat.thread.menu.label')"
    @close="(reason) => emit('close', reason)"
  >
    <UiMenuItem icon="chat-reply" @select="emit('action', 'reply')">{{
      chatText('chat.thread.menu.reply')
    }}</UiMenuItem>
    <DesignStub id="BE-080" as="div">
      <UiMenuItem
        icon="chat-forward"
        :disabled="!CHAT_STUBS.forward.enabled"
        @select="emit('action', 'forward')"
      >
        {{ chatText('chat.thread.menu.forward') }}
        <template #end>
          <span class="chat-pop__hint">{{ chatText('chat.states.soon') }}</span>
        </template>
      </UiMenuItem>
    </DesignStub>
    <UiMenuItem v-if="caps?.pin" icon="chat-pin" @select="emit('action', 'pin')">
      {{ pinned ? chatText('chat.thread.menu.unpin') : chatText('chat.thread.menu.pin') }}
    </UiMenuItem>
    <UiMenuItem v-if="mine" icon="chat-info" @select="emit('action', 'info')">
      {{ chatText('chat.thread.menu.info') }}
    </UiMenuItem>
    <UiMenuItem icon="chat-link" @select="emit('action', 'copy')">{{
      chatText('chat.thread.menu.copyLink')
    }}</UiMenuItem>
    <UiMenuItem v-if="caps?.editMessage(facts)" icon="edit" @select="emit('action', 'edit')">
      {{ chatText('chat.thread.menu.edit') }}
    </UiMenuItem>
    <UiMenuItem v-if="caps?.createTask(facts)" icon="tasks" @select="emit('action', 'task')">
      {{ chatText('chat.thread.menu.task') }}
    </UiMenuItem>
    <UiMenuItem
      v-if="caps?.closePoll(facts)"
      icon="chat-poll"
      @select="emit('action', 'closePoll')"
    >
      {{ chatText('chat.thread.menu.closePoll') }}
    </UiMenuItem>
    <UiMenuItem
      v-if="caps?.deleteMessage(facts)"
      icon="trash"
      danger
      @select="emit('action', 'delete')"
    >
      {{ chatText('chat.thread.menu.delete') }}
    </UiMenuItem>
  </UiMenu>
</template>
