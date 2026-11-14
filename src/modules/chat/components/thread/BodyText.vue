<script setup lang="ts">
import './bubble.css'

import { computed } from 'vue'

import type { ChatMessage, ChatRefSummary } from '../../model/types'
import { chatText } from '../../messages'
import {
  mentionToken,
  refToken,
  segmentBody,
  type MentionNeedle,
  type RefNeedle,
} from './rich-text'
import TaskChip from './TaskChip.vue'
import { useThread } from './use-thread'

/**
 * Mesaj metni (E-10-30/31/32): düz metin, `pre-wrap`. `mentions[]` konum taşımaz → gövdede
 * "@ad" parçası eşleştirilir; beni kapsayan bahsetme (hesabım, koordine ettiğim birim, herkes)
 * vurgulu. Görev referansı gövdedeki "#başlık" parçasını çipe çevirir; yeri bulunamayan görev
 * referansları metnin sonuna çip olarak eklenir. Eşleşmeyen metin düz kalır.
 */
const props = defineProps<{
  message: ChatMessage
  summaries: ReadonlyMap<string, ChatRefSummary>
}>()
const thread = useThread()

const mentionNeedles = computed<MentionNeedle[]>(() =>
  props.message.mentions.flatMap((m) => {
    if (m.kind === 'all')
      return [{ token: mentionToken(chatText('chat.thread.mentionAll')), me: true }]
    const id = m.target_id ?? ''
    if (m.kind === 'account') {
      const name = thread.memberName(id)
      return name ? [{ token: mentionToken(name), me: id === thread.meId.value }] : []
    }
    const name = thread.departmentName(id)
    return name ? [{ token: mentionToken(name), me: thread.myDepartments.value.includes(id) }] : []
  }),
)

function labelOf(refId: string, fallback: string): string {
  const summary = props.summaries.get(refId)
  const task = summary?.task
  if (!task) return fallback
  const code = thread.departmentCode(task.department_id)
  return `#${code ? `${code} ` : ''}${task.title}`.slice(0, 48)
}

const taskRefs = computed(() => props.message.refs.filter((r) => r.kind === 'task'))
const refNeedles = computed<RefNeedle[]>(() =>
  taskRefs.value.flatMap((ref) => {
    const title = props.summaries.get(ref.ref_id)?.task?.title
    return title ? [{ token: refToken(title), refId: ref.ref_id }] : []
  }),
)
const parsed = computed(() =>
  segmentBody(props.message.body, mentionNeedles.value, refNeedles.value),
)
const targetOf = (refId: string) => taskRefs.value.find((r) => r.ref_id === refId)?.target_id ?? ''
/**
 * Gövdede yeri olmayan görev referansları (özeti gelmiş olanlar). Başlığı olmayan referans
 * (`available:false`, silinmiş/erişilemeyen görev) iğne eşleşmesine hiç girmez; yine de "artık
 * yok" çipiyle GÖSTERİLİR (KUSUR 13: bu çip hiç çizilmiyordu).
 */
const placed = computed(
  () => new Set(parsed.value.segments.flatMap((s) => (s.kind === 'ref' ? [s.refId] : []))),
)
const trailing = computed(() =>
  taskRefs.value.filter((r) => !placed.value.has(r.ref_id) && props.summaries.has(r.ref_id)),
)
</script>

<template>
  <p v-if="message.body !== '' || trailing.length > 0" class="chat-bub__text">
    <template v-for="(segment, i) in parsed.segments" :key="i">
      <span
        v-if="segment.kind === 'mention'"
        class="chat-mention"
        :class="{ 'chat-mention--me': segment.me }"
        >{{ segment.text }}</span
      >
      <TaskChip
        v-else-if="segment.kind === 'ref'"
        :label="labelOf(segment.refId, segment.text)"
        :target-id="targetOf(segment.refId)"
        :summary="summaries.get(segment.refId)"
      />
      <template v-else>{{ segment.text }}</template>
    </template>
    <TaskChip
      v-for="ref in trailing"
      :key="ref.ref_id"
      :label="labelOf(ref.ref_id, '#')"
      :target-id="ref.target_id"
      :summary="summaries.get(ref.ref_id)"
    />
  </p>
</template>
