<script setup lang="ts">
/**
 * Grup bilgisi › Dosyalar / Görevler'in ikinci listesi (BE-084): Dosyalar = arşivden paylaşılanlar
 * (`listChatRefs`) AYRI cihaz ekleri (`listChatAttachments`); Görevler = paylaşılan görev ref'i AYRI
 * mesajdan açılan görevler (`listChatTaskLinks`). İkisi de imleçli, `seq DESC`, "Daha fazla yükle".
 * Toplam sayılar sekme başlığındadır (`getChatSharedCounts`); "n+" işareti yoktur.
 */
import './dialogs.css'

import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiEmptyState, UiHint } from '@/shared/ui'
import { notifyOutcome } from '@/shared/ui/confirm'

import { useChatDownload } from '../../api/attachments'
import { useChatAttachments, useChatTaskLinks } from '../../api/shared-queries'
import { chatText } from '../../messages'
import { formatSize } from '../thread/file-meta'
import GroupTaskLinkRow from './GroupTaskLinkRow.vue'

const props = defineProps<{ chatId: string; kind: 'file' | 'task' }>()
const emit = defineEmits<{ task: [workItemId: string]; goto: [seq: number] }>()

const store = useScopeStore()
const attachments = useChatAttachments(
  () => props.chatId,
  () => props.kind === 'file',
)
const links = useChatTaskLinks(
  () => props.chatId,
  () => props.kind === 'task',
)
const download = useChatDownload()

async function save(id: string, name: string): Promise<void> {
  const programId = store.programId
  if (programId === null) return
  const result = await download.start({ programId, kind: 'attachment', id, fallbackName: name })
  if (result.kind === 'ticket_failed') notifyOutcome(result.outcome)
}
</script>

<template>
  <section class="chat-dlg__form" :data-testid="`dlg-${kind === 'file' ? 'attachments' : 'links'}`">
    <h4 class="chat-dlg__label">
      {{
        chatText(
          kind === 'file' ? 'chat.dialogs.refs.attachments' : 'chat.dialogs.refs.linkedTasks',
        )
      }}
    </h4>
    <template v-if="kind === 'file'">
      <p v-if="attachments.query.isPending.value" role="status">
        {{ chatText('chat.states.loading') }}
      </p>
      <UiHint v-else-if="attachments.query.isError.value" error>{{
        chatText('chat.states.error')
      }}</UiHint>
      <UiEmptyState
        v-else-if="attachments.items.value.length === 0"
        :title="chatText('chat.dialogs.refs.emptyAttachments')"
      />
      <ul v-else class="chat-dlg-list">
        <li
          v-for="a in attachments.items.value"
          :key="a.attachment_id"
          class="chat-dlg-row chat-dlg-row--split"
          data-testid="dlg-attachment-row"
        >
          <span class="chat-dlg-row__main rp-trunc">{{ a.file_name }}</span>
          <span class="chat-dlg-row__meta">{{ formatSize(a.size_bytes) }}</span>
          <span class="chat-dlg__actions">
            <UiButton variant="ghost" size="sm" @click="save(a.attachment_id, a.file_name)">
              {{ chatText('chat.dialogs.refs.download') }}
            </UiButton>
            <UiButton variant="ghost" size="sm" @click="emit('goto', a.seq)">
              {{ chatText('chat.dialogs.refs.goMessage') }}
            </UiButton>
          </span>
        </li>
      </ul>
      <UiButton
        v-if="attachments.query.hasNextPage.value"
        variant="ghost"
        size="sm"
        data-testid="dlg-attachments-more"
        @click="attachments.query.fetchNextPage()"
      >
        {{ chatText('chat.list.more') }}
      </UiButton>
    </template>
    <template v-else>
      <p v-if="links.query.isPending.value" role="status">{{ chatText('chat.states.loading') }}</p>
      <UiHint v-else-if="links.query.isError.value" error>{{
        chatText('chat.states.error')
      }}</UiHint>
      <UiEmptyState
        v-else-if="links.items.value.length === 0"
        :title="chatText('chat.dialogs.refs.emptyLinked')"
      />
      <ul v-else class="chat-dlg-list">
        <GroupTaskLinkRow
          v-for="l in links.items.value"
          :key="`${l.message_id}:${l.work_item_id}`"
          :chat-id="chatId"
          :link="l"
          @task="emit('task', $event)"
          @goto="emit('goto', $event)"
        />
      </ul>
      <UiButton
        v-if="links.query.hasNextPage.value"
        variant="ghost"
        size="sm"
        data-testid="dlg-links-more"
        @click="links.query.fetchNextPage()"
      >
        {{ chatText('chat.list.more') }}
      </UiButton>
    </template>
  </section>
</template>
