<script setup lang="ts">
/**
 * "Grup bilgisi" / "Konuşma bilgisi" (E-10-18/20 → E-10-62…71): `getChat` taze okunur. Birebirde
 * yalnız karşı taraf (Üyeler/Dosyalar yok). Grupta: ad (yönetici/kurucu ve `auto_kind == null`
 * için düzenlenir, `updateChat`), alt bilgi "Grup · n üye · kuran ad", hızlı eylemler (Üye ekle,
 * Toplantı planla → `/toplantilar`; Sesi kapat devre dışı + BE-027) ve sekmeler Üyeler / Dosyalar
 * / Görevler / Sabitli (`rp-ctabs` ≙ `UiTabs`). Eylem görünürlüğü grup rolünden (`capabilities`);
 * mercek etkisizdir (P1). 404 → "Bu konuşma bulunamadı".
 */
import './dialogs.css'

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { TASKS_ROUTE } from '@/modules/work/public'
import { DesignStub, UiButton, UiHint, UiModal, UiTabs, type UiChoiceOption } from '@/shared/ui'

import { useChat, useChatMembers, useChatPins } from '../../api/queries'
import { chatText } from '../../messages'
import { canChooseSource, chatCapabilities } from '../../model/capabilities'
import { CHAT_STUBS } from '../../model/stubs'
import type { Chat, ChatMessage } from '../../model/types'
import AddMembersPanel from './AddMembersPanel.vue'
import GroupName from './GroupName.vue'
import GroupMembersTab from './GroupMembersTab.vue'
import GroupPinsTab from './GroupPinsTab.vue'
import GroupRefsTab from './GroupRefsTab.vue'
import { useChatActor } from './use-actor'

const props = defineProps<{ chatId: string }>()
const emit = defineEmits<{ close: [] }>()

type Tab = 'members' | 'files' | 'tasks' | 'pins'

const router = useRouter()
const { actor, standing } = useChatActor()
const chat = useChat(() => props.chatId)
const members = useChatMembers(
  () => props.chatId,
  () => chat.data.value?.kind === 'group',
)
const pins = useChatPins(() => props.chatId)

const tab = ref<Tab>('members')
const adding = ref(false)

const data = computed<Chat | null>(() => chat.data.value ?? null)
const isGroup = computed(() => data.value?.kind === 'group')
const caps = computed(() =>
  data.value
    ? chatCapabilities(actor.value, {
        kind: data.value.kind,
        role: data.value.role ?? 'member',
        autoKind: data.value.auto_kind,
        source: data.value.source,
      })
    : null,
)
const title = computed(() =>
  isGroup.value ? chatText('chat.dialogs.info.group') : chatText('chat.dialogs.info.direct'),
)
const name = computed(() => data.value?.name ?? data.value?.counterpart_name ?? '')
const founder = computed(() => {
  const id = data.value?.created_by_account_id
  return id ? (members.data.value?.items.find((m) => m.account_id === id)?.full_name ?? null) : null
})
const memberCount = computed(() => {
  const list = members.data.value
  if (!list) return null
  return list.truncated ? `${list.items.length}+` : String(list.items.length)
})
const pinCount = computed(() => {
  const list = pins.data.value
  if (!list) return undefined
  return list.truncated ? `${list.items.length}+` : list.items.length
})
const tabs = computed<UiChoiceOption<Tab>[]>(() => [
  {
    value: 'members',
    label: chatText('chat.dialogs.info.members'),
    count: memberCount.value ?? undefined,
  },
  { value: 'files', label: chatText('chat.dialogs.info.files') },
  { value: 'tasks', label: chatText('chat.dialogs.info.tasks') },
  { value: 'pins', label: chatText('chat.dialogs.info.pins'), count: pinCount.value },
])
const canPlanMeeting = computed(() => canChooseSource(actor.value))
const muteStub = CHAT_STUBS.mute

function open(target: Chat): void {
  emit('close')
  void router.push({ name: 'collaboration.chat', params: { chatId: target.chat_id } })
}
function leftGroup(): void {
  emit('close')
  void router.replace({ name: 'collaboration.chats' })
}
function goto(message: ChatMessage): void {
  emit('close')
  void router.push({
    name: 'collaboration.chat',
    params: { chatId: props.chatId },
    query: { mesaj: String(message.seq) },
  })
}
function openTask(workItemId: string): void {
  emit('close')
  void router.push({ name: TASKS_ROUTE.name, query: { gorev: workItemId } })
}
function planMeeting(): void {
  emit('close')
  void router.push({ name: 'collaboration.meetings' })
}
</script>

<template>
  <UiModal :open="true" :title="title" @update:open="emit('close')">
    <div class="chat-dlg" data-testid="dlg-group-info">
      <p v-if="chat.isPending.value" role="status">{{ chatText('chat.states.loading') }}</p>
      <UiHint v-else-if="chat.isError.value" error role="alert" data-testid="dlg-not-found">
        {{ chatText('chat.states.notFound') }}
      </UiHint>
      <template v-else-if="data && caps">
        <GroupName
          :chat-id="chatId"
          :name="name"
          :can-rename="caps.renameGroup"
          :is-group="isGroup"
          :member-count="memberCount"
          :founder="founder"
        />
        <template v-if="isGroup">
          <div class="chat-dlg__actions" data-testid="dlg-quick">
            <UiButton
              v-if="caps.addMembers && data.auto_kind === null"
              variant="secondary"
              size="sm"
              icon="user-plus"
              data-testid="dlg-add-members-open"
              @click="adding = !adding"
            >
              {{ chatText('chat.dialogs.members.add') }}
            </UiButton>
            <UiButton
              v-if="canPlanMeeting"
              variant="secondary"
              size="sm"
              data-testid="dlg-plan-meeting"
              @click="planMeeting"
            >
              {{ chatText('chat.dialogs.info.meeting') }}
            </UiButton>
            <DesignStub id="BE-027">
              <UiButton
                variant="secondary"
                size="sm"
                :disabled="!muteStub.enabled"
                data-testid="dlg-mute"
              >
                {{ chatText('chat.dialogs.info.mute') }}
              </UiButton>
            </DesignStub>
          </div>
          <AddMembersPanel
            v-if="adding && caps.addMembers"
            :chat-id="chatId"
            @done="adding = false"
            @cancel="adding = false"
          />
          <UiTabs v-model="tab" :options="tabs" :label="chatText('chat.dialogs.info.tabs')">
            <template #default="{ value }">
              <GroupMembersTab
                v-if="value === 'members'"
                :chat-id="chatId"
                :capabilities="caps"
                :self-id="standing?.accountId ?? null"
                @left="leftGroup"
                @open="open"
              />
              <GroupRefsTab v-else-if="value === 'files'" :chat-id="chatId" kind="file" />
              <GroupRefsTab
                v-else-if="value === 'tasks'"
                :chat-id="chatId"
                kind="task"
                @task="openTask"
              />
              <GroupPinsTab v-else :chat-id="chatId" :can-unpin="caps.pin" @goto="goto" />
            </template>
          </UiTabs>
        </template>
        <section v-else class="chat-dlg__group" data-testid="dlg-direct-pins">
          <h4 class="chat-dlg__label">{{ chatText('chat.dialogs.info.pins') }}</h4>
          <GroupPinsTab :chat-id="chatId" :can-unpin="caps.pin" @goto="goto" />
        </section>
      </template>
    </div>
    <template #footer>
      <UiButton variant="ghost" @click="emit('close')">
        {{ chatText('chat.dialogs.common.close') }}
      </UiButton>
    </template>
  </UiModal>
</template>
