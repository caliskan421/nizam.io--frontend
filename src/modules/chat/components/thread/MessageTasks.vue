<script setup lang="ts">
import './bubble.css'

import { useRouter } from 'vue-router'

import { TASKS_ROUTE, WORK_ITEM_STATUSES, workShortCode } from '@/modules/work/public'

import { useChatMessageTasks } from '../../api/shared-queries'
import { chatText, type ChatTextKey } from '../../messages'

/**
 * Mesajdan açılan görev kartları (BE-085, E-10-91): `listChatMessageTasks` TEK istekle çözer
 * (görev başına `getWorkItem` yok). `available` → kod + başlık + durum, tıkta görev; `forbidden`
 * → "Görevi görme yetkiniz yok"; `deleted` → "Görev silinmiş" (başlık sızmaz, tıklanamaz). Okuma
 * `message.updated`/`message.deleted` ve görev yazmalarından sonra yeniden yapılır (query-keys).
 */
const props = defineProps<{ chatId: string; messageId: string }>()
const router = useRouter()
const tasks = useChatMessageTasks(
  () => props.chatId,
  () => props.messageId,
)

const statusText = (status: string): string =>
  (WORK_ITEM_STATUSES as readonly string[]).includes(status)
    ? chatText(`chat.thread.taskCard.status.${status}` as ChatTextKey)
    : ''

function open(workItemId: string): void {
  void router.push({ name: TASKS_ROUTE.name, query: { gorev: workItemId } })
}
</script>

<template>
  <span class="chat-tcards" data-testid="chat-task-cards">
    <span v-if="tasks.isPending.value" class="chat-bub__note" role="status">
      {{ chatText('chat.thread.taskCard.loading') }}
    </span>
    <span v-else-if="tasks.isError.value" class="chat-bub__note" role="status">
      {{ chatText('chat.thread.taskCard.error') }}
    </span>
    <template v-else>
      <template v-for="item in tasks.data.value?.items ?? []" :key="item.work_item_id">
        <button
          v-if="item.state === 'available' && item.task"
          type="button"
          class="chat-tref chat-tcard"
          data-state="available"
          :title="chatText('chat.thread.taskCard.open')"
          @click="open(item.work_item_id)"
        >
          <span class="chat-tcard__code">{{ workShortCode(item.task) }}</span>
          <span class="chat-tcard__title rp-trunc">{{ item.task.title }}</span>
          <span v-if="statusText(item.task.status)" class="chat-tcard__status">
            {{ statusText(item.task.status) }}
          </span>
        </button>
        <span v-else class="chat-tref chat-tref--gone" :data-state="item.state">
          {{
            item.state === 'deleted'
              ? chatText('chat.thread.taskCard.deleted')
              : chatText('chat.thread.taskCard.forbidden')
          }}
        </span>
      </template>
    </template>
  </span>
</template>
