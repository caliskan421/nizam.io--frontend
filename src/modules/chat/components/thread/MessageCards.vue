<script setup lang="ts">
import './bubble.css'

import { computed } from 'vue'

import type { ChatMessage, ChatRefSummary } from '../../model/types'
import { chatText } from '../../messages'
import FileCard from './FileCard.vue'
import { useActions } from './use-actions'
import { useThread } from './use-thread'

/**
 * Mesajın kartları: yüklenen ekler (`attachments[]`) ve paylaşılan dosya/koordinatörlük
 * referansları (`refs`; özet `getChatRefSummary`). `available:false` ya da indirmede 404 → "artık
 * yok" kartı; kilitli kart çizilmez (P60, backend kazanır). Görev referansları metinde çiptir
 * (`BodyText`).
 */
const props = defineProps<{
  message: ChatMessage
  summaries: ReadonlyMap<string, ChatRefSummary>
}>()
const thread = useThread()
const actions = useActions()

interface Card {
  key: string
  kind: 'attachment' | 'shared-file'
  id: string
  name: string
  size: number | undefined
  gone: boolean
}

const cards = computed<Card[]>(() => {
  const gone = actions.gone.value
  const attachments = props.message.attachments.map((a) => ({
    key: a.attachment_id,
    kind: 'attachment' as const,
    id: a.attachment_id,
    name: a.file_name,
    size: a.size_bytes,
    gone: gone.has(a.attachment_id),
  }))
  const shared = props.message.refs
    .filter((r) => r.kind === 'file')
    .flatMap((ref) => {
      const summary = props.summaries.get(ref.ref_id)
      if (!summary) return []
      return [
        {
          key: ref.ref_id,
          kind: 'shared-file' as const,
          id: ref.ref_id,
          name: summary.file?.name ?? '',
          size: summary.file?.size_bytes,
          gone: summary.available === false || gone.has(ref.ref_id),
        },
      ]
    })
  return [...attachments, ...shared]
})

const departments = computed(() =>
  props.message.refs
    .filter((r) => r.kind === 'department')
    .flatMap((ref) => {
      const summary = props.summaries.get(ref.ref_id)
      if (!summary) return []
      return [
        {
          key: ref.ref_id,
          gone: summary.available === false,
          name: summary.department?.name ?? '',
        },
      ]
    }),
)

function open(card: Card): void {
  void actions.download({
    programId: thread.programId.value,
    kind: card.kind,
    id: card.id,
    fallbackName: card.name,
  })
}
</script>

<template>
  <FileCard
    v-for="card in cards"
    :key="card.key"
    :name="card.name"
    :size="card.size"
    :gone="card.gone"
    @open="open(card)"
  />
  <span
    v-for="department in departments"
    :key="department.key"
    class="chat-tref"
    :class="{ 'chat-tref--gone': department.gone }"
  >
    {{ department.gone ? chatText('chat.thread.gone') : department.name }}
  </span>
</template>
