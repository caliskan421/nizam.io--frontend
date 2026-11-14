<script setup lang="ts">
/**
 * "Yeni grup" penceresi (E-10-04 → E-10-76…80): segment "Birebir" / "Grup" (varsayılan istekteki
 * kip). Grup: ad (≤80) + üyeler (aday listesi; ≤200) → `createGroupChat` (`Idempotency-Key`
 * kullanıcı eylemi başına; `source: none`); 201/200 `Chat` → sohbet açılır. Birebir: aday seçimi
 * → `openDirectChat` (201 yeni, 200 mevcut; ikisi de "sohbeti aç"); 403 → "Bu kişiyle doğrudan
 * yazışamazsınız…" (§10.6).
 */
import './dialogs.css'

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiField, UiHint, UiInput, UiModal, UiSegmented } from '@/shared/ui'
import { UiOutcomeNotice } from '@/shared/ui/confirm'
import type { UiChoiceOption } from '@/shared/ui'

import { useChatCandidates } from '../../api/queries'
import { useCreateGroupChat, useOpenDirectChat } from '../../api/writes'
import { chatText } from '../../messages'
import type { Chat } from '../../model/types'
import CandidatePicker from './CandidatePicker.vue'
import { GROUP_MEMBERS_MAX, GROUP_NAME_MAX, validateGroup } from './forms'
import { useDialogWrite } from './use-dialog-write'

const props = defineProps<{ mode: 'group' | 'direct' }>()
const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const store = useScopeStore()
const kind = ref<'group' | 'direct'>(props.mode)
const name = ref('')
const members = ref<string[]>([])
const invalid = ref<string | null>(null)
const denied = ref(false)

const candidates = useChatCandidates(() => kind.value)
const items = computed(() => candidates.data.value?.items ?? [])
const truncated = computed(() => candidates.data.value?.truncated === true)

const createGroup = useCreateGroupChat()
const openDirect = useOpenDirectChat()
const write = useDialogWrite()
const pending = computed(() => createGroup.isPending.value || openDirect.isPending.value)

const kinds = computed<UiChoiceOption<'group' | 'direct'>[]>(() => [
  { value: 'direct', label: chatText('chat.dialogs.newChat.direct') },
  { value: 'group', label: chatText('chat.dialogs.newChat.group') },
])

function setKind(next: 'group' | 'direct' | null): void {
  if (next === null) return
  kind.value = next
  invalid.value = null
  denied.value = false
  write.clear()
}

function toggle(accountId: string): void {
  members.value = members.value.includes(accountId)
    ? members.value.filter((id) => id !== accountId)
    : [...members.value, accountId]
}

function done(chat: Chat): void {
  emit('close')
  void router.push({ name: 'collaboration.chat', params: { chatId: chat.chat_id } })
}

async function submitGroup(): Promise<void> {
  const error = validateGroup(name.value, members.value)
  invalid.value = error
  if (error !== null || pending.value) return
  const programId = store.programId
  if (programId === null) return
  const outcome = await createGroup.submit({
    programId,
    body: {
      name: name.value.trim(),
      member_account_ids: [...members.value],
      source: 'none',
    },
  })
  write.settle(outcome, done)
}

async function openChat(accountId: string): Promise<void> {
  const programId = store.programId
  if (programId === null || pending.value) return
  denied.value = false
  const outcome = await openDirect.submit({ programId, accountId })
  const failure = write.settle(outcome, done)
  denied.value = failure?.class === 'forbidden'
}

function resolved(outcome: unknown): void {
  write.settle(outcome as Parameters<typeof write.settle<Chat>>[0], done)
}

function setOpen(): void {
  if (!pending.value) emit('close')
}
</script>

<template>
  <UiModal
    :open="true"
    :title="chatText('chat.dialogs.newGroup')"
    :description="chatText('chat.dialogs.newChat.description')"
    :dismissible="!pending"
    @update:open="setOpen"
  >
    <div class="chat-dlg" data-testid="dlg-new-chat">
      <UiSegmented
        :model-value="kind"
        :options="kinds"
        :label="chatText('chat.dialogs.newChat.kind')"
        @update:model-value="setKind"
      />
      <form
        v-if="kind === 'group'"
        id="chat-new-group"
        class="chat-dlg__form"
        novalidate
        @submit.prevent="submitGroup"
      >
        <UiField
          :label="chatText('chat.dialogs.newChat.name')"
          :error="
            invalid === 'nameRequired' || invalid === 'nameTooLong'
              ? chatText(`chat.dialogs.newChat.error.${invalid}`)
              : write.fieldErrors.value.name
          "
        >
          <UiInput v-model="name" name="name" data-autofocus />
        </UiField>
        <UiHint data-testid="dlg-name-count">
          {{
            chatText('chat.dialogs.common.count', { n: name.trim().length, max: GROUP_NAME_MAX })
          }}
        </UiHint>
        <p class="chat-dlg__label">
          {{ chatText('chat.dialogs.newChat.members') }}
          <span data-testid="dlg-member-count">
            {{ chatText('chat.dialogs.newChat.memberCount', { n: members.length }) }}
          </span>
        </p>
        <p v-if="candidates.isPending.value" role="status">{{ chatText('chat.states.loading') }}</p>
        <UiHint v-else-if="candidates.isError.value" error>
          {{ chatText('chat.states.error') }}
        </UiHint>
        <CandidatePicker
          v-else
          multi
          :candidates="items"
          :selected="members"
          :truncated="truncated"
          :label="chatText('chat.dialogs.newChat.search')"
          @toggle="toggle"
        />
        <UiHint v-if="invalid === 'membersRequired' || invalid === 'membersTooMany'" error>
          {{ chatText(`chat.dialogs.newChat.error.${invalid}`, { max: GROUP_MEMBERS_MAX }) }}
        </UiHint>
        <UiHint>{{ chatText('chat.dialogs.newChat.systemNote') }}</UiHint>
      </form>
      <div v-else class="chat-dlg__form">
        <p v-if="candidates.isPending.value" role="status">{{ chatText('chat.states.loading') }}</p>
        <UiHint v-else-if="candidates.isError.value" error>
          {{ chatText('chat.states.error') }}
        </UiHint>
        <CandidatePicker
          v-else
          :candidates="items"
          :truncated="truncated"
          :label="chatText('chat.dialogs.newChat.searchPerson')"
          @pick="openChat"
        />
        <UiHint v-if="denied" error data-testid="dlg-cannot-direct">
          {{ chatText('chat.dialogs.cannotDirect') }}
        </UiHint>
      </div>
      <UiHint v-if="write.message.value && !denied" error role="alert" data-testid="dlg-error">
        {{ write.message.value }}
      </UiHint>
      <UiOutcomeNotice :outcome="write.notice.value" @resolved="resolved" />
    </div>
    <template #footer>
      <UiButton variant="ghost" :disabled="pending" @click="setOpen">
        {{ chatText('chat.dialogs.common.cancel') }}
      </UiButton>
      <UiButton
        v-if="kind === 'group'"
        variant="primary"
        type="submit"
        form="chat-new-group"
        :disabled="pending"
        data-testid="dlg-submit"
      >
        {{ chatText('chat.dialogs.newChat.create') }}
      </UiButton>
    </template>
  </UiModal>
</template>
