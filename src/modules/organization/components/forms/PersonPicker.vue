<script setup lang="ts">
import './forms.css'

import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'

import { UiAvatar, UiButton, UiChip, UiHint, UiInput } from '@/shared/ui'
import { useFieldContext } from '@/shared/ui/field-context'

import { useUserList } from '../../api'
import type { PersonOption } from '../../model/types'
import type { PersonPickerEmits, PersonPickerProps } from '../index'
import { orgText } from './messages'

/**
 * W74 · E-08-33/79, E-05-33 seçici (P3: `shared/ui` ile en sade; tasarımda çizilmemiş).
 * `listUsers` `search` (yalnız ad, sunucuda Türkçe katlamalı) ~300 ms gecikmeli; imleçli —
 * "Daha fazla yükle". Sorgu yalnız seçici etkinken açılır (pencere açılmadan istek yok).
 * Seçenekten `excludeAccountIds` düşülür. Klavye: ↑/↓ gezinir, Enter seçer, Esc listeyi kapatır.
 * `UiField` içindeyse etiket/hata bağı oradan; değilse `label` erişilebilir ad olur.
 */
const props = withDefaults(defineProps<PersonPickerProps>(), { excludeAccountIds: () => [] })
const emit = defineEmits<PersonPickerEmits>()

const SEARCH_DELAY_MS = 300

const field = useFieldContext()
const listId = `of-picker-${useId()}`
const term = ref('')
const search = ref('')
const active = ref(false)
const cursor = ref(-1)
let timer: ReturnType<typeof setTimeout> | undefined

watch(term, (value) => {
  if (timer !== undefined) clearTimeout(timer)
  timer = setTimeout(() => {
    search.value = value.trim()
    cursor.value = -1
  }, SEARCH_DELAY_MS)
})
onBeforeUnmount(() => {
  if (timer !== undefined) clearTimeout(timer)
})

const list = useUserList(
  () => ({ search: search.value || null, sortOrder: 'asc' }),
  () => active.value && props.modelValue === null,
)
const query = list.query

const options = computed<PersonOption[]>(() => {
  const excluded = new Set(props.excludeAccountIds)
  return list.users.value
    .filter((u) => !excluded.has(u.account_id))
    .map((u) => ({ accountId: u.account_id, fullName: u.full_name }))
})
const loading = computed(() => query.isPending.value && query.fetchStatus.value === 'fetching')
const failed = computed(() => query.isError.value)
const open = computed(() => active.value && props.modelValue === null)
const activeId = computed(() =>
  cursor.value >= 0 && cursor.value < options.value.length
    ? `${listId}-${cursor.value}`
    : undefined,
)

function choose(option: PersonOption): void {
  emit('update:modelValue', { accountId: option.accountId, fullName: option.fullName })
  term.value = ''
  cursor.value = -1
}

function clear(): void {
  emit('update:modelValue', null)
  active.value = true
}

function onKeydown(event: KeyboardEvent): void {
  const count = options.value.length
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    active.value = true
    if (count === 0) return
    const step = event.key === 'ArrowDown' ? 1 : -1
    cursor.value = (cursor.value + step + count) % count
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    const option = options.value[cursor.value]
    if (option) choose(option)
    return
  }
  if (event.key === 'Escape' && open.value) {
    event.stopPropagation()
    active.value = false
    cursor.value = -1
  }
}
</script>

<template>
  <div class="of-picker" data-testid="person-picker">
    <div v-if="modelValue" class="of-picker__selected" data-testid="picker-selected">
      <UiAvatar :name="modelValue.fullName" size="sm" />
      <UiChip removable :remove-label="orgText('orgForms.picker.clear')" @remove="clear">
        {{ modelValue.fullName }}
      </UiChip>
      <span class="rp-sr" role="status">
        {{ orgText('orgForms.picker.selected', { name: modelValue.fullName }) }}
      </span>
    </div>
    <template v-else>
      <UiInput
        v-model="term"
        type="search"
        icon="search"
        name="person-search"
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        :aria-label="field ? undefined : label"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="listId"
        :aria-activedescendant="activeId"
        :placeholder="orgText('orgForms.picker.placeholder')"
        @focus="active = true"
        @keydown="onKeydown"
      />
      <template v-if="open">
        <ul
          :id="listId"
          class="of-picker__list"
          role="listbox"
          :aria-label="orgText('orgForms.picker.results')"
          data-testid="picker-list"
        >
          <li
            v-for="(option, index) in options"
            :id="`${listId}-${index}`"
            :key="option.accountId"
            class="rp-menuitem"
            role="option"
            :aria-selected="index === cursor ? 'true' : 'false'"
            :data-account="option.accountId"
            @mousedown.prevent
            @click="choose(option)"
          >
            <UiAvatar :name="option.fullName" size="sm" />
            <span class="rp-trunc">{{ option.fullName }}</span>
          </li>
        </ul>
        <div class="of-picker__status" aria-live="polite">
          <UiHint v-if="loading">{{ orgText('orgForms.picker.loading') }}</UiHint>
          <template v-else-if="failed">
            <UiHint error>{{ orgText('orgForms.picker.failed') }}</UiHint>
            <UiButton size="sm" variant="ghost" @click="query.refetch()">
              {{ orgText('orgForms.picker.retry') }}
            </UiButton>
          </template>
          <UiHint v-else-if="options.length === 0" data-testid="picker-empty">
            {{ orgText('orgForms.picker.empty') }}
          </UiHint>
          <UiHint v-if="list.truncated.value">{{ orgText('orgForms.picker.truncated') }}</UiHint>
          <UiButton
            v-if="query.hasNextPage.value"
            size="sm"
            variant="ghost"
            :disabled="query.isFetchingNextPage.value"
            data-testid="picker-more"
            @click="query.fetchNextPage()"
          >
            {{ orgText('orgForms.picker.more') }}
          </UiButton>
        </div>
      </template>
    </template>
  </div>
</template>
