<script setup lang="ts">
import './composer.css'

import { UiButton } from '@/shared/ui'

import { chatText } from '../../messages'
import type { SuggestOption } from './use-suggest'

/**
 * Öneri listesi (E-10-50/61): `role="listbox"`; odak metin alanında kalır (`aria-activedescendant`
 * üstte), ok tuşları + Enter üst bileşende yönetilir. Görev önerisinde alt bilgi: paylaşılan
 * özet herkese görünür, görevi açmak yetki ister (P60; "kilitli görür" yok).
 */
defineProps<{
  options: readonly SuggestOption[]
  active: number
  kind: '@' | '#'
  idPrefix: string
  hasMore: boolean
  loading: boolean
}>()
const emit = defineEmits<{ pick: [index: number]; more: [] }>()
</script>

<template>
  <div class="chat-suggest" data-testid="chat-suggest">
    <div
      :id="`${idPrefix}-list`"
      role="listbox"
      :aria-label="
        kind === '@'
          ? chatText('chat.composer.suggestMention')
          : chatText('chat.composer.suggestTask')
      "
    >
      <div
        v-for="(option, i) in options"
        :id="`${idPrefix}-${i}`"
        :key="option.id"
        role="option"
        class="chat-suggest__row"
        :aria-selected="i === active"
        @mousedown.prevent="emit('pick', i)"
      >
        <span v-if="option.code" class="chat-suggest__code">{{ option.code }}</span>
        <span v-else aria-hidden="true" />
        <span class="chat-suggest__label">{{ option.label }}</span>
      </div>
    </div>
    <p v-if="options.length === 0 && !loading" class="chat-suggest__foot">
      {{ chatText('chat.composer.suggestEmpty') }}
    </p>
    <p v-if="loading" class="chat-suggest__foot" role="status">
      {{ chatText('chat.composer.suggestLoading') }}
    </p>
    <UiButton
      v-if="hasMore && !loading"
      size="sm"
      variant="ghost"
      @mousedown.prevent="emit('more')"
    >
      {{ chatText('chat.composer.suggestMore') }}
    </UiButton>
    <p v-if="kind === '#'" class="chat-suggest__foot">
      {{ chatText('chat.composer.suggestTaskNote') }}
    </p>
  </div>
</template>
