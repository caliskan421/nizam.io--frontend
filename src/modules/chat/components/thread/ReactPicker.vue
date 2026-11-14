<script setup lang="ts">
import './bubble.css'

import { onMounted, ref } from 'vue'

import { REACTION_KINDS } from '../../model/message-state'
import type { ChatMessage, ReactionKind } from '../../model/types'
import { chatText } from '../../messages'

/**
 * Tepki seçici (E-10-40): DÖRT tepki (P61; 😂 🎉 🙏 sözleşmede yok → çizilmez). `role="menu"`,
 * açılınca odak ilk tepkide; ←/→ gezinir; Esc ve Tab `close` yayar (odağı tetiğe döndürmek açanın
 * işi). Benim tepkim `aria-pressed`.
 */
const props = defineProps<{ message: Pick<ChatMessage, 'reactions'> }>()
const emit = defineEmits<{ pick: [kind: ReactionKind]; close: [reason: 'escape' | 'tab'] }>()
const root = ref<HTMLElement | null>(null)
const mine = (kind: ReactionKind) => props.message.reactions.some((r) => r.kind === kind && r.mine)

function buttons(): HTMLButtonElement[] {
  return [...(root.value?.querySelectorAll('button') ?? [])]
}
onMounted(() => buttons()[0]?.focus())

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close', 'escape')
    return
  }
  if (event.key === 'Tab') return emit('close', 'tab')
  const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (step === 0) return
  event.preventDefault()
  const all = buttons()
  const at = all.indexOf(document.activeElement as HTMLButtonElement)
  all[(at + step + all.length) % all.length]?.focus()
}
</script>

<template>
  <div
    ref="root"
    class="rp-pop chat-pop chat-pop--react"
    role="menu"
    :aria-label="chatText('chat.thread.reactions')"
    @keydown="onKeydown"
  >
    <button
      v-for="kind in REACTION_KINDS"
      :key="kind"
      type="button"
      role="menuitemradio"
      class="chat-pop__emoji"
      :aria-checked="mine(kind)"
      :aria-pressed="mine(kind)"
      :aria-label="chatText(`chat.thread.reactionName.${kind}`)"
      @click="emit('pick', kind)"
    >
      {{ chatText(`chat.thread.reaction.${kind}`) }}
    </button>
  </div>
</template>
