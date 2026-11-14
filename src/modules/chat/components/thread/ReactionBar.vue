<script setup lang="ts">
import './bubble.css'

import type { ChatMessage, ReactionKind } from '../../model/types'
import { chatText } from '../../messages'

/**
 * Tepki çipleri (E-10-38): `reactions[]` (tür, sayı, benim); dört tür (P61). Tık: koy / yer
 * değiştir ya da aynı türe tık kaldırır (karar `reactionIntent`); iyimser değişiklik yok —
 * işlem sürerken çipler meşgul (devre dışı) kalır. Tepki edenlerin adları gösterilmez.
 */
defineProps<{ message: Pick<ChatMessage, 'reactions'>; busy: boolean }>()
const emit = defineEmits<{ toggle: [kind: ReactionKind] }>()
</script>

<template>
  <div
    v-if="message.reactions.length > 0"
    class="chat-reacts"
    role="group"
    :aria-label="chatText('chat.thread.reactions')"
  >
    <button
      v-for="reaction in message.reactions"
      :key="reaction.kind"
      type="button"
      class="chat-react"
      :aria-pressed="reaction.mine"
      :aria-label="`${chatText(`chat.thread.reactionName.${reaction.kind}`)} ${reaction.count}`"
      :disabled="busy"
      @click="emit('toggle', reaction.kind)"
    >
      <span aria-hidden="true">{{ chatText(`chat.thread.reaction.${reaction.kind}`) }}</span>
      <span aria-hidden="true">{{ reaction.count }}</span>
    </button>
  </div>
</template>
