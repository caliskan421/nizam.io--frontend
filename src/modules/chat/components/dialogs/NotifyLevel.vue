<script setup lang="ts">
/**
 * Sohbet bildirim seviyesi (BE-027 ayar yüzü, E-10-65/70): "Tüm mesajlar" / "Yalnız @bahsedilince
 * bildir" / "Sessize al" → `setChatNotificationLevel` (S2, CSRF; yalnız `Chat.notify_level` okunur,
 * yoksa `all`). Seçim sunucu cevabından sonra görünür: yazma bitene dek önceki değer gösterilir
 * (iyimser güncelleme yok); başarıda liste + ayrıntı yeniden okunur. Okunmamış sayacı seviyeden
 * bağımsızdır (K46/K54).
 */
import './dialogs.css'

import { computed } from 'vue'

import { useScopeStore } from '@/shared/scope/store'
import { UiField, UiHint, UiSelect, type UiSelectOption } from '@/shared/ui'
import { UiOutcomeNotice } from '@/shared/ui/confirm'

import { useSetChatNotificationLevel } from '../../api/notify-writes'
import { chatText } from '../../messages'
import type { ChatNotificationLevel } from '../../model/shared-types'
import { useDialogWrite } from './use-dialog-write'

const props = defineProps<{ chatId: string; level: ChatNotificationLevel | undefined }>()

const store = useScopeStore()
const set = useSetChatNotificationLevel()
const write = useDialogWrite()

const current = computed<ChatNotificationLevel>(() => props.level ?? 'all')
const options = computed<UiSelectOption[]>(() => [
  { value: 'all', label: chatText('chat.dialogs.info.notifyAll') },
  { value: 'mentions', label: chatText('chat.dialogs.info.notifyMentions') },
  { value: 'none', label: chatText('chat.dialogs.info.notifyNone') },
])

async function change(value: string): Promise<void> {
  const programId = store.programId
  if (programId === null || value === current.value || set.isPending.value) return
  const outcome = await set.submit({
    programId,
    chatId: props.chatId,
    level: value as ChatNotificationLevel,
  })
  write.settle(outcome, () => undefined)
}
</script>

<template>
  <div class="chat-dlg__group" data-testid="dlg-notify">
    <UiField :label="chatText('chat.dialogs.info.notify')">
      <UiSelect
        :model-value="current"
        :options="options"
        :disabled="set.isPending.value"
        data-testid="dlg-notify-level"
        @update:model-value="change"
      />
    </UiField>
    <UiHint v-if="write.message.value" error role="alert" data-testid="dlg-notify-error">
      {{ write.message.value }}
    </UiHint>
    <UiOutcomeNotice :outcome="write.notice.value" />
  </div>
</template>
