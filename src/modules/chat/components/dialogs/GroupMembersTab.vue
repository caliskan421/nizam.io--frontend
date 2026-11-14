<script setup lang="ts">
/**
 * Grup bilgisi › Üyeler (E-10-68…71): `listChatMembers` (≤200; `truncated` → "200+"). Satır: ad,
 * grup rolü ("Yönetici"/"Kurucu"; program rolü ve birim adı yok, BE-083), kendisi "(sen)".
 * Eylemler `capabilities`tan (grup rolü; mercek etkisiz): "Mesaj" (hedef birebir aday listesinde
 * ise `openDirectChat`, değilse §10.6 metni), "Çıkar" (kaynaktan gelen üye çıkarılmaz),
 * "Yönetici yap/Yöneticiliği al" ve "Gruptan ayrıl" — yıkıcı olanlar ortak onayla.
 */
import './dialogs.css'

import { computed, ref } from 'vue'

import { useScopeStore } from '@/shared/scope/store'
import { UiAvatar, UiButton, UiHint, useToast } from '@/shared/ui'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'

import { useChatCandidates, useChatMembers } from '../../api/queries'
import {
  useGrantChatAdmin,
  useOpenDirectChat,
  useRemoveChatMember,
  useRevokeChatAdmin,
} from '../../api/writes'
import { chatText } from '../../messages'
import { memberRoleFacts, type ChatCapabilities } from '../../model/capabilities'
import type { Chat, ChatMember } from '../../model/types'

const props = defineProps<{
  chatId: string
  capabilities: ChatCapabilities
  selfId: string | null
}>()
const emit = defineEmits<{ left: []; open: [chat: Chat] }>()

const store = useScopeStore()
const members = useChatMembers(() => props.chatId)
const direct = useChatCandidates('direct')
const remove = useRemoveChatMember()
const grant = useGrantChatAdmin()
const revoke = useRevokeChatAdmin()
const openDirect = useOpenDirectChat()
const { confirmWrite } = useConfirm()
const toast = useToast()
const denied = ref<string | null>(null)

const items = computed(() => members.data.value?.items ?? [])
const directIds = computed(() => new Set((direct.data.value?.items ?? []).map((c) => c.account_id)))
const self = computed(() => items.value.find((m) => m.account_id === props.selfId) ?? null)
const busy = computed(
  () =>
    remove.isPending.value ||
    grant.isPending.value ||
    revoke.isPending.value ||
    openDirect.isPending.value,
)
const roleLabel = (m: ChatMember): string => {
  const badge = memberRoleFacts(m.role).badge
  return badge === null ? '' : chatText(`chat.dialogs.members.${badge}`)
}

function target(accountId: string) {
  return { programId: store.programId!, chatId: props.chatId, accountId }
}

async function message(m: ChatMember): Promise<void> {
  if (store.programId === null || busy.value) return
  denied.value = null
  if (!directIds.value.has(m.account_id)) {
    denied.value = m.account_id
    return
  }
  const outcome = await openDirect.submit({ programId: store.programId, accountId: m.account_id })
  if (outcome.kind === 'success') emit('open', outcome.data)
  else if (outcome.kind === 'failed' && outcome.error.code === 'messaging.not_authorized') {
    denied.value = m.account_id
  } else notifyOutcome(outcome)
}

async function kick(m: ChatMember, leaving: boolean): Promise<void> {
  if (store.programId === null || busy.value) return
  const outcome = await confirmWrite(
    {
      title: chatText(
        leaving ? 'chat.dialogs.members.leaveTitle' : 'chat.dialogs.members.removeTitle',
      ),
      body: [
        chatText(leaving ? 'chat.dialogs.members.leaveBody' : 'chat.dialogs.members.removeBody', {
          name: m.full_name,
        }),
      ],
      confirmLabel: chatText(
        leaving ? 'chat.dialogs.members.leave' : 'chat.dialogs.members.remove',
      ),
      tone: 'danger',
    },
    (context) => remove.submit(target(m.account_id), { context }),
  )
  if (outcome === null) return
  if (outcome.kind !== 'success') {
    notifyOutcome(outcome)
    return
  }
  if (leaving) emit('left')
  else toast.push({ message: chatText('chat.dialogs.members.removed') })
}

async function setAdmin(m: ChatMember, on: boolean): Promise<void> {
  if (store.programId === null || busy.value) return
  const outcome = await (on ? grant : revoke).submit(target(m.account_id))
  if (outcome.kind !== 'success') notifyOutcome(outcome)
}
</script>

<template>
  <div class="chat-dlg__form" data-testid="dlg-members">
    <p v-if="members.isPending.value" role="status">{{ chatText('chat.states.loading') }}</p>
    <UiHint v-else-if="members.isError.value" error>{{ chatText('chat.states.error') }}</UiHint>
    <ul v-else class="chat-dlg-list">
      <li v-for="m in items" :key="m.account_id" class="chat-dlg-row chat-dlg-row--split">
        <span class="chat-dlg-row__main">
          <UiAvatar :name="m.full_name" size="sm" />
          <span class="rp-trunc">
            {{
              m.account_id === selfId
                ? chatText('chat.dialogs.members.you', { name: m.full_name })
                : m.full_name
            }}
          </span>
          <span v-if="roleLabel(m)" class="chat-dlg-row__meta">{{ roleLabel(m) }}</span>
        </span>
        <span v-if="m.account_id !== selfId" class="chat-dlg__actions">
          <UiButton variant="ghost" size="sm" :disabled="busy" @click="message(m)">
            {{ chatText('chat.dialogs.members.message') }}
          </UiButton>
          <UiButton
            v-if="capabilities.grantAdmin && memberRoleFacts(m.role).adminAction === 'grant'"
            variant="ghost"
            size="sm"
            :disabled="busy"
            @click="setAdmin(m, true)"
          >
            {{ chatText('chat.dialogs.members.makeAdmin') }}
          </UiButton>
          <UiButton
            v-if="capabilities.grantAdmin && memberRoleFacts(m.role).adminAction === 'revoke'"
            variant="ghost"
            size="sm"
            :disabled="busy"
            @click="setAdmin(m, false)"
          >
            {{ chatText('chat.dialogs.members.revokeAdmin') }}
          </UiButton>
          <UiButton
            v-if="capabilities.removeMember({ fromSource: m.from_source })"
            variant="ghost"
            size="sm"
            :disabled="busy"
            data-testid="dlg-member-remove"
            @click="kick(m, false)"
          >
            {{ chatText('chat.dialogs.members.remove') }}
          </UiButton>
        </span>
        <UiHint v-if="denied === m.account_id" error data-testid="dlg-cannot-direct">
          {{ chatText('chat.dialogs.cannotDirect') }}
        </UiHint>
      </li>
    </ul>
    <UiHint v-if="members.data.value?.truncated">
      {{ chatText('chat.dialogs.members.truncated') }}
    </UiHint>
    <button
      v-if="self && capabilities.leaveGroup({ fromSource: self.from_source })"
      type="button"
      class="chat-dlg__leave"
      :disabled="busy"
      data-testid="dlg-leave"
      @click="kick(self, true)"
    >
      {{ chatText('chat.dialogs.members.leave') }}
    </button>
  </div>
</template>
