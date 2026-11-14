<script setup lang="ts">
/** Paylaşılanlar satırı: ad/başlık `getChatRefSummary`dan (P60: kilit çizilmez, yalnız "artık yok"). */
import './dialogs.css'

import { computed } from 'vue'

import { UiButton } from '@/shared/ui'

import { useChatRefSummary } from '../../api/queries'
import { chatText } from '../../messages'
import type { ChatSharedRef } from '../../model/types'

const props = defineProps<{ shared: ChatSharedRef; kind: 'file' | 'task' }>()
const emit = defineEmits<{
  save: [shared: ChatSharedRef, name: string]
  task: [workItemId: string]
}>()

const summary = useChatRefSummary(() => props.shared.ref_id)
const gone = computed(() => summary.data.value?.available === false)
const label = computed(() => {
  const data = summary.data.value
  if (data === undefined) return ''
  if (!data.available) return chatText('chat.dialogs.refs.gone')
  return (props.kind === 'file' ? data.file?.name : data.task?.title) ?? ''
})
</script>

<template>
  <li class="chat-dlg-row chat-dlg-row--split" data-testid="dlg-ref-row">
    <span class="chat-dlg-row__main rp-trunc">{{ label }}</span>
    <UiButton
      v-if="kind === 'file' && !gone && summary.data.value"
      variant="ghost"
      size="sm"
      @click="emit('save', shared, label)"
    >
      {{ chatText('chat.dialogs.refs.download') }}
    </UiButton>
    <UiButton
      v-else-if="kind === 'task' && !gone && summary.data.value"
      variant="ghost"
      size="sm"
      @click="emit('task', shared.target_id)"
    >
      {{ chatText('chat.dialogs.refs.openTask') }}
    </UiButton>
  </li>
</template>
