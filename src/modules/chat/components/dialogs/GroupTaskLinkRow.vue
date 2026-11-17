<script setup lang="ts">
/**
 * "Mesajdan açılan görevler" satırı (BE-084 `listChatTaskLinks` + BE-085): bağ yalnız `work_item_id`
 * ve mesaj taşır; görünürlük ve kart `listChatMessageTasks` ile (mesaj başına tek istek, mesaj
 * görev kartlarıyla AYNI sorgu) okunur: `forbidden` → "Görevi görme yetkiniz yok", `deleted` →
 * "Görev silinmiş" (başlık sızmaz).
 */
import './dialogs.css'

import { computed } from 'vue'

import { workShortCode } from '@/modules/work/public'
import { UiButton } from '@/shared/ui'

import { useChatMessageTasks } from '../../api/shared-queries'
import { chatText } from '../../messages'
import type { ChatTaskLink } from '../../model/shared-types'

const props = defineProps<{ chatId: string; link: ChatTaskLink }>()
const emit = defineEmits<{ task: [workItemId: string]; goto: [seq: number] }>()

const tasks = useChatMessageTasks(
  () => props.chatId,
  () => props.link.message_id,
)
const item = computed(
  () => tasks.data.value?.items.find((i) => i.work_item_id === props.link.work_item_id) ?? null,
)
const open = computed(() => item.value?.state === 'available' && item.value.task !== null)
const label = computed(() => {
  const found = item.value
  if (found === null) return chatText('chat.dialogs.refs.taskRow')
  if (found.state === 'deleted') return chatText('chat.thread.taskCard.deleted')
  if (found.state === 'forbidden' || found.task === null) {
    return chatText('chat.thread.taskCard.forbidden')
  }
  return `${workShortCode(found.task)} ${found.task.title}`.trim()
})
</script>

<template>
  <li class="chat-dlg-row chat-dlg-row--split" data-testid="dlg-link-row" :data-state="item?.state">
    <span class="chat-dlg-row__main rp-trunc">{{ label }}</span>
    <span class="chat-dlg__actions">
      <UiButton v-if="open" variant="ghost" size="sm" @click="emit('task', link.work_item_id)">
        {{ chatText('chat.dialogs.refs.openTask') }}
      </UiButton>
      <UiButton variant="ghost" size="sm" @click="emit('goto', link.seq)">
        {{ chatText('chat.dialogs.refs.goMessage') }}
      </UiButton>
    </span>
  </li>
</template>
