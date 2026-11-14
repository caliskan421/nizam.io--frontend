<script setup lang="ts">
/**
 * Grup bilgisi › Dosyalar / Görevler sekmeleri (E-10-68): `listChatRefs` (`kind` süzgeci,
 * "Daha fazla yükle"); sayaç çizilmez (BE-084). Satır adı `getChatRefSummary`dan; özet her üyeye
 * açıktır (P60), `available: false` → "artık yok". Dosya indirme bilet akışıyla
 * (`downloadChatSharedFile`); görev `/gorevler?gorev=` bağlantısıdır (görevi açmak görev yetkisi
 * ister).
 */
import './dialogs.css'

import { computed } from 'vue'

import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiEmptyState, UiHint } from '@/shared/ui'
import { notifyOutcome } from '@/shared/ui/confirm'

import { useChatDownload } from '../../api/attachments'
import { useChatRefs } from '../../api/queries'
import { chatText } from '../../messages'
import type { ChatSharedRef } from '../../model/types'
import GroupRefRow from './GroupRefRow.vue'

const props = defineProps<{ chatId: string; kind: 'file' | 'task' }>()
const emit = defineEmits<{ task: [workItemId: string] }>()

const store = useScopeStore()
const refs = useChatRefs(
  () => props.chatId,
  () => props.kind,
)
const download = useChatDownload()
const items = computed(() => refs.items.value)

async function save(ref: ChatSharedRef, name: string): Promise<void> {
  const programId = store.programId
  if (programId === null) return
  const result = await download.start({
    programId,
    kind: 'shared-file',
    id: ref.ref_id,
    fallbackName: name,
  })
  if (result.kind === 'ticket_failed') notifyOutcome(result.outcome)
}
</script>

<template>
  <div class="chat-dlg__form" data-testid="dlg-refs">
    <p v-if="refs.query.isPending.value" role="status">{{ chatText('chat.states.loading') }}</p>
    <UiHint v-else-if="refs.query.isError.value" error>{{ chatText('chat.states.error') }}</UiHint>
    <UiEmptyState
      v-else-if="items.length === 0"
      :title="
        chatText(kind === 'file' ? 'chat.dialogs.refs.emptyFiles' : 'chat.dialogs.refs.emptyTasks')
      "
    />
    <ul v-else class="chat-dlg-list">
      <GroupRefRow
        v-for="ref in items"
        :key="ref.ref_id"
        :shared="ref"
        :kind="kind"
        @save="save"
        @task="emit('task', $event)"
      />
    </ul>
    <UiButton
      v-if="refs.query.hasNextPage.value"
      variant="ghost"
      size="sm"
      data-testid="dlg-refs-more"
      @click="refs.query.fetchNextPage()"
    >
      {{ chatText('chat.list.more') }}
    </UiButton>
  </div>
</template>
