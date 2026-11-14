<script setup lang="ts">
/**
 * Grup bilgisi › Üye ekle (E-10-66): aday seçici E-10-78 kalıbında; `listChatCandidates?
 * purpose=group&chat_id=` (mevcut üyeler düşer) + `addChatMembers` (≤200, anahtarsız). 204 →
 * üye listesi ve adaylar tazelenir (veri katmanı). Yalnız yönetici/kurucu ve `auto_kind == null`.
 */
import './dialogs.css'

import { computed, ref } from 'vue'

import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiHint, useToast } from '@/shared/ui'

import { useChatCandidates } from '../../api/queries'
import { useAddChatMembers } from '../../api/writes'
import { chatText } from '../../messages'
import CandidatePicker from './CandidatePicker.vue'
import { GROUP_MEMBERS_MAX } from './forms'
import { useDialogWrite } from './use-dialog-write'

const props = defineProps<{ chatId: string }>()
const emit = defineEmits<{ done: []; cancel: [] }>()

const store = useScopeStore()
const candidates = useChatCandidates('group', () => props.chatId)
const add = useAddChatMembers()
const write = useDialogWrite()
const toast = useToast()
const selected = ref<string[]>([])
const items = computed(() => candidates.data.value?.items ?? [])

function toggle(accountId: string): void {
  selected.value = selected.value.includes(accountId)
    ? selected.value.filter((id) => id !== accountId)
    : [...selected.value, accountId]
}

async function submit(): Promise<void> {
  const programId = store.programId
  if (programId === null || add.isPending.value || selected.value.length === 0) return
  const outcome = await add.submit({
    programId,
    chatId: props.chatId,
    accountIds: [...selected.value],
  })
  write.settle(outcome, () => {
    toast.push({ message: chatText('chat.dialogs.members.added') })
    emit('done')
  })
}
</script>

<template>
  <div class="chat-dlg__form" data-testid="dlg-add-members">
    <p v-if="candidates.isPending.value" role="status">{{ chatText('chat.states.loading') }}</p>
    <UiHint v-else-if="candidates.isError.value" error>{{ chatText('chat.states.error') }}</UiHint>
    <CandidatePicker
      v-else
      multi
      :candidates="items"
      :selected="selected"
      :truncated="candidates.data.value?.truncated === true"
      :label="chatText('chat.dialogs.newChat.search')"
      @toggle="toggle"
    />
    <UiHint v-if="selected.length > GROUP_MEMBERS_MAX" error>
      {{ chatText('chat.dialogs.newChat.error.membersTooMany', { max: GROUP_MEMBERS_MAX }) }}
    </UiHint>
    <UiHint v-if="write.message.value" error role="alert" data-testid="dlg-error">
      {{ write.message.value }}
    </UiHint>
    <div class="chat-dlg__actions">
      <UiButton variant="ghost" size="sm" :disabled="add.isPending.value" @click="emit('cancel')">
        {{ chatText('chat.dialogs.common.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        size="sm"
        :disabled="add.isPending.value || selected.length === 0"
        data-testid="dlg-add-submit"
        @click="submit"
      >
        {{ chatText('chat.dialogs.members.add') }}
      </UiButton>
    </div>
  </div>
</template>
