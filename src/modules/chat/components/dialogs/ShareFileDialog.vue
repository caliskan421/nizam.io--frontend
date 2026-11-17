<script setup lang="ts">
/**
 * "Dosya paylaş" (E-10-54/55 → E-10-101…107): "Arşivden" / "Yeni yükle" (varsayılan yeni yükle).
 * Yeni yükle: TEK dosya, izinli 11 tür, isteğe bağlı açıklama (`body` parçası dosyadan ÖNCE),
 * `sendChatAttachment` multipart; tavan sunucudadır (422 alanın altında). "Görev arşivine de
 * kaydet" (BE-029) açıksa tek `archiveChatFile` (`Idempotency-Key` + `client_message_id`
 * arşivleme boyunca sabit); iki adımlı attachFile → sendChatMessage yolu YOKTUR. Arşivden:
 * `sendChatMessage` + `refs[{file}]` + gövde (boş gövde yerine not ya da dosya adı). Mesaj
 * kimliği seçim/gönderim başına BİR kez üretilir; ağ tekrarı aynı kimlik + aynı gövde.
 */
import './dialogs.css'

import { computed, ref, watch } from 'vue'

import { useScopeStore } from '@/shared/scope/store'
import {
  UiButton,
  UiField,
  UiHint,
  UiInput,
  UiModal,
  UiSegmented,
  type UiChoiceOption,
} from '@/shared/ui'
import { UiOutcomeNotice } from '@/shared/ui/confirm'

import { useChat } from '../../api/queries'
import { useArchiveChatFile, useSendChatAttachment } from '../../api/attachments'
import { useSendChatMessage } from '../../api/writes'
import { chatText } from '../../messages'
import { ATTACHMENT_EXTENSIONS, hasAllowedExtension } from '../../model/attachments'
import { newClientMessageId } from '../../model/message-state'
import ArchivePane from './ArchivePane.vue'
import ArchiveSaveFields from './ArchiveSaveFields.vue'
import type { ArchiveSaveChoice } from './archive-save'
import { sizeKb, type PickedArchiveFile } from './forms'
import { useDialogWrite } from './use-dialog-write'

const props = defineProps<{ chatId: string; tab?: 'archive' | 'upload' }>()
const emit = defineEmits<{ close: [] }>()

const store = useScopeStore()
const chat = useChat(() => props.chatId)
const sendAttachment = useSendChatAttachment()
const sendMessage = useSendChatMessage()
const archiveSave = useArchiveChatFile()
const write = useDialogWrite()

const tab = ref<'upload' | 'archive'>(props.tab ?? 'upload')
const file = ref<File | null>(null)
const fileError = ref<'type' | 'required' | null>(null)
const note = ref('')
const archiveFile = ref<PickedArchiveFile | null>(null)
const saveToTask = ref(false)
const tried = ref(false)
const saveChoice = ref<ArchiveSaveChoice | null>(null)
const dragging = ref(false)
const input = ref<HTMLInputElement | null>(null)
// Gönderim kimliği seçim başına: ağ tekrarında aynı kimlik (K5).
let clientMessageId = newClientMessageId()

const pending = computed(
  () =>
    sendAttachment.isPending.value || sendMessage.isPending.value || archiveSave.isPending.value,
)
const chatName = computed(() => chat.data.value?.name ?? '')
const tabs = computed<UiChoiceOption<'upload' | 'archive'>[]>(() => [
  { value: 'archive', label: chatText('chat.dialogs.share.fromArchive') },
  { value: 'upload', label: chatText('chat.dialogs.share.upload') },
])
const accept = ATTACHMENT_EXTENSIONS.map((e) => `.${e}`).join(',')

// Yeni eylem (dosya/seçim/not değişti): yeni mesaj kimliği; ağ tekrarı aynı kimliği korur (K5).
watch([file, archiveFile, saveChoice, note], () => {
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
    const caption = note.value.trim()
    if (saveToTask.value) {
      tried.value = true
      if (saveChoice.value === null) return
      const saved = await archiveSave.submit({
        programId,
        chatId: props.chatId,
        clientMessageId,
        file: file.value,
        workItemId: saveChoice.value.workItemId,
        tag: saveChoice.value.tag,
        ...(caption === '' ? {} : { body: caption }),
      })
      write.settle(saved, sentOk)
      return
    }
    const outcome = await sendAttachment.submit({
      programId,
      chatId: props.chatId,
      clientMessageId,
      file: file.value,
      ...(caption === '' ? {} : { caption }),
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
        <ArchiveSaveFields
          v-model:enabled="saveToTask"
          :tried="tried"
          :field-errors="write.fieldErrors.value"
          :disabled="pending"
          @change="saveChoice = $event"
        />
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
