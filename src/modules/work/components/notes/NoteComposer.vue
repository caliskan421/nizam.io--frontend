<script setup lang="ts">
import './notes.css'

import { computed } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { UiOutcomeNotice } from '@/shared/ui/confirm'
import { UiButton } from '@/shared/ui'

import { notesText } from './messages'
import type { UnknownNotice } from './use-note-actions'

/**
 * Not yazma / düzenleme alanı (tasarım `rp-composer`; P3 minimum). Uzunluk sınırı yok: şema
 * (`WorkNoteRequest.content`) sınır tanımlamaz, istemci uydurmaz; yalnız boş (boşluk) içerik
 * gönderilmez. Ctrl/⌘+Enter gönderir. "Sonuç bilinmiyor" yerinde gösterilir (`notice`); o
 * sürerken AYNI taslak yeni anahtarla yeniden gönderilemez (kör gönderim yok) — yeniden
 * gönderme bildirimdeki düğmeyle aynı anahtarladır, taslağı değiştirmek yeni eylemdir.
 */
const props = withDefaults(
  defineProps<{
    label: string
    submitLabel: string
    placeholder?: string
    busy?: boolean
    cancelable?: boolean
    notice?: UnknownNotice | null
    /** Bildirim sürerken kilitlenen taslak (bildirimdeki gönderimin içeriği). */
    noticeDraft?: string | null
  }>(),
  { placeholder: '', busy: false, cancelable: false, notice: null, noticeDraft: null },
)
const draft = defineModel<string>({ required: true })
const emit = defineEmits<{
  submit: [content: string]
  cancel: []
  resolved: [outcome: MutationOutcome<unknown, unknown, unknown>]
}>()

const content = computed(() => draft.value.trim())
const blocked = computed(() => props.notice !== null && content.value === props.noticeDraft)
const ready = computed(() => content.value !== '' && !props.busy && !blocked.value)

function submit(): void {
  if (ready.value) emit('submit', content.value)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    submit()
  }
}
</script>

<template>
  <form class="wk-composer" :aria-busy="busy" @submit.prevent="submit">
    <textarea
      v-model="draft"
      class="wk-composer__input"
      data-testid="note-input"
      :aria-label="label"
      :placeholder="placeholder"
      :disabled="busy"
      @keydown="onKeydown"
    />
    <div class="wk-composer__foot">
      <UiButton
        v-if="cancelable"
        variant="ghost"
        size="sm"
        :disabled="busy"
        @click="emit('cancel')"
      >
        {{ notesText('cancel') }}
      </UiButton>
      <UiButton
        type="submit"
        variant="primary"
        size="sm"
        data-testid="note-submit"
        :disabled="!ready"
      >
        {{ submitLabel }}
      </UiButton>
    </div>
    <UiOutcomeNotice :outcome="notice" @resolved="emit('resolved', $event)" />
  </form>
</template>
