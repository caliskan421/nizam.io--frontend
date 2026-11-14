<script setup lang="ts">
/**
 * "Dosya paylaş" (E-10-54/55 → E-10-101…107): segment "Arşivden" / "Yeni yükle" (varsayılan yeni
 * yükle). Yeni yükle: TEK dosya (çoklu seçim yok), izinli 11 tür, isteğe bağlı açıklama
 * (`body` parçası dosyadan ÖNCE), `sendChatAttachment` multipart; tavan sunucudadır (422
 * `file_too_large` / `file_rejected` alanın altında). "Görev arşivine de kaydet" devre dışı + BE-029.
 * Arşivden: `sendChatMessage` + `refs[{file}]` + gövde (boş gövde gönderilmez: not ya da dosya adı).
 * Mesaj kimliği seçim/gönderim başına BİR kez üretilir; ağ tekrarı aynı kimlik + aynı gövde.
 */
import './dialogs.css'

import { computed, ref, watch } from 'vue'

import { useScopeStore } from '@/shared/scope/store'
import {
  DesignStub,
  UiButton,
  UiCheck,
  UiField,
  UiHint,
  UiInput,
  UiModal,
  UiSegmented,
  type UiChoiceOption,
} from '@/shared/ui'
import { UiOutcomeNotice } from '@/shared/ui/confirm'

import { useChat } from '../../api/queries'
import { useSendChatAttachment } from '../../api/attachments'
import { useSendChatMessage } from '../../api/writes'
import { chatText } from '../../messages'
import { ATTACHMENT_EXTENSIONS, hasAllowedExtension } from '../../model/attachments'
import { newClientMessageId } from '../../model/message-state'
import ArchivePane from './ArchivePane.vue'
import { sizeKb, type PickedArchiveFile } from './forms'
import { useDialogWrite } from './use-dialog-write'

const props = defineProps<{ chatId: string; tab?: 'archive' | 'upload' }>()
const emit = defineEmits<{ close: [] }>()

const store = useScopeStore()
const chat = useChat(() => props.chatId)
const sendAttachment = useSendChatAttachment()
const sendMessage = useSendChatMessage()
const write = useDialogWrite()

const tab = ref<'upload' | 'archive'>(props.tab ?? 'upload')
const file = ref<File | null>(null)
const fileError = ref<'type' | 'required' | null>(null)
const note = ref('')
const archiveFile = ref<PickedArchiveFile | null>(null)
const dragging = ref(false)
const input = ref<HTMLInputElement | null>(null)
// Gönderim kimliği seçim başına: ağ tekrarında aynı kimlik (K5).
let clientMessageId = newClientMessageId()

const pending = computed(() => sendAttachment.isPending.value || sendMessage.isPending.value)
const chatName = computed(() => chat.data.value?.name ?? '')
const tabs = computed<UiChoiceOption<'upload' | 'archive'>[]>(() => [
  { value: 'archive', label: chatText('chat.dialogs.share.fromArchive') },
  { value: 'upload', label: chatText('chat.dialogs.share.upload') },
])
const accept = ATTACHMENT_EXTENSIONS.map((e) => `.${e}`).join(',')

watch([file, archiveFile], () => {
  clientMessageId = newClientMessageId()
})

function choose(next: File | null): void {
  fileError.value = null
  write.clear()
  if (next === null) {
    file.value = null
    return
  }
  if (!hasAllowedExtension(next.name)) {
    file.value = null
    fileError.value = 'type'
    return
  }
  file.value = next
}
function onInput(event: Event): void {
  const target = event.target as HTMLInputElement
  choose(target.files?.[0] ?? null)
  target.value = ''
}
function onDrop(event: DragEvent): void {
  dragging.value = false
  choose(event.dataTransfer?.files?.[0] ?? null)
}
function setTab(next: 'upload' | 'archive' | null): void {
  if (next === null) return
  tab.value = next
  write.clear()
}

function sentOk(): void {
  emit('close')
}

async function submit(): Promise<void> {
  const programId = store.programId
  if (pending.value || programId === null) return
  if (tab.value === 'upload') {
    if (file.value === null) {
      fileError.value = 'required'
      return
    }
    const outcome = await sendAttachment.submit({
      programId,
      chatId: props.chatId,
      clientMessageId,
      file: file.value,
      ...(note.value.trim() === '' ? {} : { caption: note.value.trim() }),
    })
    write.settle(outcome, sentOk)
    return
  }
  const picked = archiveFile.value
  if (picked === null) return
  const outcome = await sendMessage.submit({
    programId,
    chatId: props.chatId,
    body: {
      client_message_id: clientMessageId,
      body: note.value.trim() === '' ? picked.name : note.value.trim(),
      refs: [{ kind: 'file', target_id: picked.fileId }],
    },
  })
  write.settle(outcome, sentOk)
}

function resolved(outcome: unknown): void {
  write.settle(outcome as Parameters<typeof write.settle<never>>[0], sentOk)
}

function setOpen(): void {
  if (!pending.value) emit('close')
}
const canSend = computed(() =>
  tab.value === 'upload' ? file.value !== null : archiveFile.value !== null,
)
</script>

<template>
  <UiModal
    :open="true"
    :title="chatText('chat.dialogs.shareFile')"
    :description="chatText('chat.dialogs.share.description', { name: chatName })"
    :dismissible="!pending"
    @update:open="setOpen"
  >
    <form id="chat-share" class="chat-dlg chat-dlg__form" novalidate @submit.prevent="submit">
      <UiSegmented
        :model-value="tab"
        :options="tabs"
        :label="chatText('chat.dialogs.share.source')"
        @update:model-value="setTab"
      />
      <div v-if="tab === 'upload'" class="chat-dlg__form" data-testid="dlg-upload">
        <div
          class="chat-dlg__drop"
          :class="{ 'chat-dlg__drop--over': dragging }"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop"
        >
          <p v-if="file" data-testid="dlg-file">
            <strong>{{ file.name }}</strong>
            · {{ chatText('chat.dialogs.share.size', { n: sizeKb(file.size) }) }}
          </p>
          <p v-else>{{ chatText('chat.dialogs.share.drop') }}</p>
          <UiButton variant="secondary" size="sm" @click="input?.click()">
            {{ chatText(file ? 'chat.dialogs.share.another' : 'chat.dialogs.share.pick') }}
          </UiButton>
          <input
            ref="input"
            class="chat-dlg__file"
            type="file"
            :accept="accept"
            :aria-label="chatText('chat.dialogs.share.pick')"
            data-testid="dlg-file-input"
            @change="onInput"
          />
        </div>
        <UiHint v-if="fileError" error data-testid="dlg-file-error">
          {{ chatText(`chat.dialogs.share.error.${fileError}`) }}
        </UiHint>
        <UiHint v-else-if="write.fieldErrors.value.file" error>
          {{ write.fieldErrors.value.file }}
        </UiHint>
        <DesignStub id="BE-029" as="div">
          <label class="chat-dlg__check">
            <UiCheck :model-value="false" disabled data-testid="dlg-save-archive" />
            <span>{{ chatText('chat.dialogs.share.saveToTask') }}</span>
          </label>
        </DesignStub>
      </div>
      <ArchivePane v-else @change="archiveFile = $event" />
      <UiField :label="chatText('chat.dialogs.share.note')">
        <UiInput v-model="note" name="note" />
      </UiField>
      <UiHint v-if="write.message.value" error role="alert" data-testid="dlg-error">
        {{ write.message.value }}
      </UiHint>
      <UiOutcomeNotice :outcome="write.notice.value" @resolved="resolved" />
    </form>
    <template #footer>
      <UiButton variant="ghost" :disabled="pending" @click="setOpen">
        {{ chatText('chat.dialogs.common.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        form="chat-share"
        :disabled="pending || !canSend"
        data-testid="dlg-submit"
      >
        {{ chatText('chat.dialogs.share.send') }}
      </UiButton>
    </template>
  </UiModal>
</template>
