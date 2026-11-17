<script setup lang="ts">
/**
 * Grup bilgisi başlığı (E-10-62…64): avatar, ad, alt bilgi "Grup · n üye · kuran ad". Ad düzenleme
 * (E-10-63; yalnız `canRename`): form açılırken `getChat` taze okunur, `updateChat` (sürüm yok,
 * son yazan kazanır), tek satır ≤80 (istemci), boşsa alan hatası.
 */
import './dialogs.css'

import { ref } from 'vue'

import { useScopeStore } from '@/shared/scope/store'
import { UiAvatar, UiButton, UiField, UiHint, UiIconButton, UiInput, useToast } from '@/shared/ui'

import { useChat } from '../../api/queries'
import { useUpdateChat } from '../../api/writes'
import { chatText } from '../../messages'
import { GROUP_NAME_MAX } from './forms'
import { useDialogWrite } from './use-dialog-write'

const props = defineProps<{
  chatId: string
  name: string
  canRename: boolean
  isGroup: boolean
  memberCount: string | null
  founder: string | null
  /** Kaynak bilgisi (BE-160 "Koordinatörler" grubu); `null` = satır yok. */
  sourceNote?: string | null
}>()

const store = useScopeStore()
const chat = useChat(() => props.chatId)
const update = useUpdateChat()
const write = useDialogWrite()
const toast = useToast()
const renaming = ref(false)
const draft = ref('')
const invalid = ref(false)

function start(): void {
  draft.value = props.name
  invalid.value = false
  renaming.value = true
  void chat.refetch()
}

async function save(): Promise<void> {
  const trimmed = draft.value.trim()
  invalid.value = trimmed === '' || trimmed.length > GROUP_NAME_MAX
  const programId = store.programId
  if (invalid.value || programId === null || update.isPending.value) return
  const outcome = await update.submit({ programId, chatId: props.chatId, body: { name: trimmed } })
  write.settle(outcome, () => {
    renaming.value = false
    toast.push({ message: chatText('chat.dialogs.info.renamed') })
  })
}
</script>

<template>
  <header class="chat-dlg__who">
    <UiAvatar :name="name" size="xl" />
    <div class="chat-dlg__who-text">
      <form v-if="renaming" class="chat-dlg__form" novalidate @submit.prevent="save">
        <UiField
          :label="chatText('chat.dialogs.info.name')"
          :error="
            invalid
              ? chatText('chat.dialogs.newChat.error.nameRequired')
              : write.fieldErrors.value.name
          "
        >
          <UiInput v-model="draft" name="name" data-autofocus />
        </UiField>
        <span class="chat-dlg__actions">
          <UiButton variant="ghost" size="sm" @click="renaming = false">
            {{ chatText('chat.dialogs.common.cancel') }}
          </UiButton>
          <UiButton variant="primary" size="sm" type="submit" :disabled="update.isPending.value">
            {{ chatText('chat.dialogs.common.save') }}
          </UiButton>
        </span>
        <UiHint v-if="write.message.value" error role="alert">{{ write.message.value }}</UiHint>
      </form>
      <template v-else>
        <h3 class="chat-dlg__name">{{ name }}</h3>
        <UiIconButton
          v-if="canRename"
          icon="edit"
          :label="chatText('chat.dialogs.info.rename')"
          data-testid="dlg-rename"
          @click="start"
        />
      </template>
      <p v-if="isGroup" class="chat-dlg__sub" data-testid="dlg-group-sub">
        {{ chatText('chat.dialogs.info.sub', { n: memberCount ?? '…' }) }}
        <template v-if="founder">
          · {{ chatText('chat.dialogs.info.founder', { name: founder }) }}
        </template>
        <template v-if="sourceNote"> · {{ sourceNote }}</template>
      </p>
    </div>
  </header>
</template>
