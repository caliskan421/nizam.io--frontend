<script setup lang="ts">
/**
 * Aday seçici (E-10-78, E-10-66, E-10-76 "Birebir"): ada göre istemci süzmesi, tekli (`pick`) ya
 * da çoklu (`toggle`, çip + "‹Ad› çıkar", sayaç) seçim. `truncated` → "Liste ilk 200 kişiyle
 * sınırlı" (§10.6). Veri üst bileşenindir; burada yalnız görünüm ve süzme.
 */
import './dialogs.css'

import { computed, ref } from 'vue'

import { UiAvatar, UiChip, UiHint, UiIcon, UiInput } from '@/shared/ui'

import { chatText } from '../../messages'
import { filterByName, type CandidateLike } from './forms'

const props = withDefaults(
  defineProps<{
    candidates: readonly CandidateLike[]
    selected?: readonly string[]
    multi?: boolean
    truncated?: boolean
    label: string
    /** Satırlarda gösterilmeyecek hesap (kendisi). */
    excludeId?: string | null
  }>(),
  { selected: () => [], multi: false, truncated: false, excludeId: null },
)
const emit = defineEmits<{ toggle: [accountId: string]; pick: [accountId: string] }>()

const query = ref('')
const rows = computed(() =>
  filterByName(
    props.candidates.filter((c) => c.account_id !== props.excludeId),
    query.value,
  ),
)
const chosen = computed(() => props.candidates.filter((c) => props.selected.includes(c.account_id)))

function activate(accountId: string): void {
  if (props.multi) emit('toggle', accountId)
  else emit('pick', accountId)
}
</script>

<template>
  <div class="chat-dlg-picker" data-testid="chat-picker">
    <UiInput v-model="query" type="search" icon="search" :aria-label="label" :placeholder="label" />
    <ul v-if="multi && chosen.length > 0" class="chat-dlg-chips" data-testid="chat-picker-chips">
      <li v-for="c in chosen" :key="c.account_id">
        <UiChip
          removable
          :remove-label="chatText('chat.dialogs.common.removeChip', { name: c.full_name })"
          @remove="emit('toggle', c.account_id)"
        >
          {{ c.full_name }}
        </UiChip>
      </li>
    </ul>
    <ul v-if="rows.length > 0" class="chat-dlg-list" data-testid="chat-picker-list">
      <li v-for="c in rows" :key="c.account_id">
        <button
          type="button"
          class="chat-dlg-row"
          :aria-pressed="multi ? selected.includes(c.account_id) : undefined"
          @click="activate(c.account_id)"
        >
          <UiAvatar :name="c.full_name" size="sm" />
          <span class="chat-dlg-row__name">{{ c.full_name }}</span>
          <UiIcon v-if="multi && selected.includes(c.account_id)" name="check" />
        </button>
      </li>
    </ul>
    <UiHint v-else data-testid="chat-picker-empty">{{
      chatText('chat.dialogs.common.noMatch')
    }}</UiHint>
    <UiHint v-if="truncated" data-testid="chat-picker-truncated">
      {{ chatText('chat.dialogs.truncated') }}
    </UiHint>
  </div>
</template>
