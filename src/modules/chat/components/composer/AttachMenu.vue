<script setup lang="ts">
import './composer.css'

import { UiIcon, UiMenu } from '@/shared/ui'
import type { IconName } from '@/shared/ui'

import { chatText } from '../../messages'

/**
 * Ekle menüsü (E-10-53): Arşivden dosya, Yeni dosya yükle, Görev kartı (`#`), Kişi ya da grup
 * an (`@`), Anket (yalnız grupta; birebirde DOM'da yok). `role="menu"`; Esc/Tab kapatır (odağı
 * Ekle düğmesine döndürmek açanın işi).
 */
defineProps<{ poll: boolean }>()
const emit = defineEmits<{
  pick: [name: 'archive' | 'upload' | 'task' | 'mention' | 'poll']
  close: [reason: 'escape' | 'tab']
}>()

const items: {
  name: 'archive' | 'upload' | 'task' | 'mention' | 'poll'
  icon: IconName
  tone: string
  title: string
  hint: string
}[] = [
  { name: 'archive', icon: 'archive', tone: 'file', title: 'archiveFile', hint: 'archiveFileHint' },
  { name: 'upload', icon: 'upload', tone: 'upload', title: 'uploadFile', hint: 'uploadFileHint' },
  { name: 'task', icon: 'chat-hash', tone: 'task', title: 'taskCard', hint: 'taskCardHint' },
  { name: 'mention', icon: 'chat-at', tone: 'mention', title: 'mention', hint: 'mentionHint' },
  { name: 'poll', icon: 'chat-poll', tone: 'poll', title: 'poll', hint: 'pollHint' },
]
const text = (key: string, sign?: string) =>
  chatText(`chat.composer.${key}` as 'chat.composer.send', sign ? { sign } : {})
const signOf = (name: string) => (name === 'task' ? '#' : name === 'mention' ? '@' : undefined)
</script>

<template>
  <UiMenu
    class="chat-plus"
    :label="chatText('chat.composer.attachMenu')"
    @close="(r) => emit('close', r)"
  >
    <template v-for="item in items" :key="item.name">
      <button
        v-if="item.name !== 'poll' || poll"
        type="button"
        class="chat-plus__item"
        role="menuitem"
        tabindex="-1"
        @click="emit('pick', item.name)"
      >
        <span class="chat-plus__ic" :class="`chat-plus__ic--${item.tone}`"
          ><UiIcon :name="item.icon" size="sm"
        /></span>
        <span class="chat-plus__text">
          <strong>{{ text(item.title) }}</strong>
          <small>{{ text(item.hint, signOf(item.name)) }}</small>
        </span>
      </button>
    </template>
  </UiMenu>
</template>
