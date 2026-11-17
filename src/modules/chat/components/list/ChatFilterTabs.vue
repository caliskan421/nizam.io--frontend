<script setup lang="ts">
/**
 * Süzgeç sekmeleri (E-10-06): Tümü · Okunmamış · Gruplar · Kişiler. Gezici `tabindex`; ←/→,
 * Home/End odağı taşır ve sekmeyi seçer (UiTabs kalıbı). "sekme sayacı `counts`'tan gelir: etkin sekmede sunucu `list.total`
 * (süzülmüş toplam), etkin olmayan "Okunmamış"ta programın kesin `unread_chats` değeri (E-10-07);
 * yoksa ya da 0 ise gizli. `controls`: liste çizilmişse kimliği
 * (liste yokken `aria-controls` verilmez, KESİN 27).
 */
import { ref, useId } from 'vue'

import { rovingTarget } from '@/shared/ui/roving'

import { chatText } from '../../messages'
import { CHAT_FILTERS, type ChatFilter } from './chat-view'

defineProps<{ counts: Partial<Record<ChatFilter, number | null>>; controls?: string }>()
const model = defineModel<ChatFilter>({ required: true })
const base = `chat-tab-${useId()}`
const list = ref<HTMLElement | null>(null)

const LABELS: Record<ChatFilter, Parameters<typeof chatText>[0]> = {
  all: 'chat.list.filterAll',
  unread: 'chat.list.filterUnread',
  groups: 'chat.list.filterGroups',
  people: 'chat.list.filterPeople',
}

function onKeydown(event: KeyboardEvent): void {
  const tabs = [...(list.value?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])]
  const target = rovingTarget(event, tabs, 'horizontal')
  const value = CHAT_FILTERS.find((f) => f === target?.dataset.filter)
  if (value) model.value = value
}
</script>

<template>
  <div
    ref="list"
    class="chat-tabs"
    role="tablist"
    :aria-label="chatText('chat.list.filterLabel')"
    @keydown="onKeydown"
  >
    <button
      v-for="filter in CHAT_FILTERS"
      :id="`${base}-${filter}`"
      :key="filter"
      type="button"
      role="tab"
      :data-filter="filter"
      :aria-selected="model === filter ? 'true' : 'false'"
      :aria-controls="controls"
      :tabindex="model === filter ? 0 : -1"
      @click="model = filter"
    >
      {{ chatText(LABELS[filter]) }}
      <span v-if="counts[filter]" class="chat-tabs__n">{{ counts[filter] }}</span>
    </button>
  </div>
</template>
