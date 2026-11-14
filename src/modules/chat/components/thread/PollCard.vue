<script setup lang="ts">
import './bubble.css'

import { computed } from 'vue'

import { UiIcon } from '@/shared/ui'

import { messageFacts } from '../../model/capabilities'
import type { ChatMessage } from '../../model/types'
import { chatText } from '../../messages'
import { pollEndOf } from './format'
import { useActions } from './use-actions'
import { useThread } from './use-thread'

/**
 * Anket kartı (E-10-35): soru = gövde; "Tek/Çoklu seçim · isimli · son <tarih>"; yüzde = `count` /
 * tekil oy veren sayısı (çoklu seçimde toplam %100'ü aşabilir); "<n> kişi oy verdi". Oy:
 * `voteChatPoll` (`option_indexes` kümesi yerine geçer; tüm seçimler kalkınca `[]` oyu geri çeker);
 * işlem sürerken meşgul, 204 → `around` okuması (yazma katmanı). Kapanmış ankette seçenekler devre
 * dışı + "Anket kapandı". Anonim kip yoktur (BE-161): "isimli" sabittir. Oy verenlerin adları
 * gösterilmez.
 */
const props = defineProps<{ message: ChatMessage }>()
const thread = useThread()
const actions = useActions()

const poll = computed(() => props.message.poll)
const closed = computed(() => messageFacts(props.message).pollClosed)
const busy = computed(() => actions.pending.value.has(props.message.message_id))
const canVote = computed(() => {
  const facts = messageFacts(props.message)
  return thread.caps.value?.vote(facts) === true && !busy.value
})
const mine = computed(
  () =>
    new Set(
      (poll.value?.results ?? [])
        .filter((r) => r.voters.some((v) => v.account_id === thread.meId.value))
        .map((r) => r.option_index),
    ),
)
const voters = computed(
  () => new Set((poll.value?.results ?? []).flatMap((r) => r.voters.map((v) => v.account_id))).size,
)
const meta = computed(() => {
  const p = poll.value
  if (!p) return ''
  const parts = [
    p.multi ? chatText('chat.thread.poll.multi') : chatText('chat.thread.poll.single'),
    chatText('chat.thread.poll.named'),
  ]
  if (p.closes_at) parts.push(chatText('chat.thread.poll.until', { date: pollEndOf(p.closes_at) }))
  return parts.join(' · ')
})
const percent = (count: number): number =>
  voters.value === 0 ? 0 : Math.round((count / voters.value) * 100)

/** Seçeneğe dokunuş: tek seçimde yerine geçer / geri çeker; çoklu seçimde kümeye ekler-çıkarır. */
function nextSelection(index: number): number[] {
  const set = new Set(mine.value)
  if (poll.value?.multi) {
    if (set.has(index)) set.delete(index)
    else set.add(index)
    return [...set].sort((a, b) => a - b)
  }
  return set.has(index) ? [] : [index]
}
</script>

<template>
  <div v-if="poll" class="chat-poll" role="group" :aria-label="chatText('chat.thread.poll.label')">
    <p class="chat-poll__q">
      <UiIcon name="chat-poll" size="sm" />
      <strong>{{ message.body }}</strong>
    </p>
    <span class="chat-poll__meta">{{ meta }}</span>
    <button
      v-for="result in poll.results"
      :key="result.option_index"
      type="button"
      class="chat-poll__opt"
      :class="{ 'chat-poll__opt--on': mine.has(result.option_index) }"
      :aria-pressed="mine.has(result.option_index)"
      :disabled="!canVote"
      @click="void actions.vote(message, nextSelection(result.option_index))"
    >
      <span
        class="chat-poll__bar"
        :style="{ width: `${percent(result.count)}%` }"
        aria-hidden="true"
      />
      <span class="chat-poll__label">
        <UiIcon v-if="mine.has(result.option_index)" name="check" size="sm" />
        <span>{{ result.label }}</span>
      </span>
      <span class="chat-poll__meta">{{
        chatText('chat.thread.poll.percent', { n: percent(result.count) })
      }}</span>
    </button>
    <span class="chat-poll__meta">{{ chatText('chat.thread.poll.voted', { n: voters }) }}</span>
    <span v-if="closed" class="chat-poll__meta" role="status">{{
      chatText('chat.thread.poll.closed')
    }}</span>
  </div>
</template>
