<script setup lang="ts">
import './bubble.css'

import { computed } from 'vue'

import { UiIcon } from '@/shared/ui'

import { messageFacts } from '../../model/capabilities'
import type { ChatMessage } from '../../model/types'
import { chatText } from '../../messages'
import { pollEndOf } from './format'
import { pollView } from './poll-view'
import { useActions } from './use-actions'
import { useThread } from './use-thread'

/**
 * Anket kartı (E-10-35): soru = gövde; "Tek/Çoklu seçim · isimli · son <tarih>"; yüzde = `count` /
 * tekil oy veren sayısı (çoklu seçimde toplam %100'ü aşabilir); "<n> kişi oy verdi". Oy:
 * `voteChatPoll` (`option_indexes` kümesi yerine geçer; tüm seçimler kalkınca `[]` oyu geri çeker);
 * işlem sürerken meşgul, 204 → `around` okuması (yazma katmanı). Kapanmış ankette seçenekler devre
 * dışı + "Anket kapandı". Anonimlik açılışta belirlenir (`poll.anonymous`, BE-161): "isimli"/"anonim" etiketi
 * sunucudan gelir; kendi oy `mine`'dandır, sayılar `poll-view.ts`'tendir. Oy verenlerin adları
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
const view = computed(() => (poll.value ? pollView(poll.value) : null))
const mine = computed(() => view.value?.mine ?? new Set<number>())
const meta = computed(() => {
  const p = poll.value
  if (!p) return ''
  const parts = [
    p.multi ? chatText('chat.thread.poll.multi') : chatText('chat.thread.poll.single'),
    p.anonymous ? chatText('chat.thread.poll.anonymous') : chatText('chat.thread.poll.named'),
  ]
  if (p.closes_at) parts.push(chatText('chat.thread.poll.until', { date: pollEndOf(p.closes_at) }))
  return parts.join(' · ')
})
/** Seçenek sağ metni: kişi sayısı biliniyorsa yüzde, bilinmiyorsa (anonim + çoklu) oy sayısı. */
function shareText(count: number): string {
  const percent = view.value?.percent(count) ?? null
  return percent === null
    ? chatText('chat.thread.poll.votes', { n: count })
    : chatText('chat.thread.poll.percent', { n: percent })
}

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
        :style="{ width: `${view?.bar(result.count) ?? 0}%` }"
        aria-hidden="true"
      />
      <span class="chat-poll__label">
        <UiIcon v-if="mine.has(result.option_index)" name="check" size="sm" />
        <span>{{ result.label }}</span>
      </span>
      <span class="chat-poll__meta">{{ shareText(result.count) }}</span>
    </button>
    <span v-if="view?.voters != null" class="chat-poll__meta">{{
      chatText('chat.thread.poll.voted', { n: view.voters })
    }}</span>
    <span v-if="closed" class="chat-poll__meta" role="status">{{
      chatText('chat.thread.poll.closed')
    }}</span>
  </div>
</template>
