<script setup lang="ts">
import './tasks.css'

import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { UiCount, UiIcon, UiMenu, UiMenuItem } from '@/shared/ui'

import type { WorkItem } from '../../model/types'
import { tasksText } from './messages'

/**
 * Kişi süzgeci (E-03-11, BE-038): ÇOKLU seçim, sunucuya `assignee_account_id` (VEYA, en çok 50)
 * gider. Aday dizini yok (BE-039) → seçenekler görülen `assignees[]` birleşimidir; süzgeç
 * seçilince yüklenen küme daraldığı için görülenler oturum boyunca birikir (seçili kimlik adı
 * bilinmiyorsa "Bilinmeyen kişi"). Üye merceğinde kilitli (küme zaten "ben"). Menü dışarı
 * tıklama, Esc ve Tab ile kapanır; odak tetiğe döner.
 */
const props = defineProps<{
  people: readonly string[]
  candidates: readonly Pick<WorkItem, 'assignees'>[]
  locked: boolean
}>()
const emit = defineEmits<{ 'update:people': [people: string[]] }>()

const MAX = 50
const seen = ref(new Map<string, string>())
watch(
  () => props.candidates,
  (rows) => {
    for (const row of rows) {
      for (const a of row.assignees) {
        if (a.full_name || !seen.value.has(a.account_id)) {
          seen.value.set(a.account_id, a.full_name ?? '')
        }
      }
    }
  },
  { immediate: true, deep: false },
)

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

function options(): { id: string; name: string }[] {
  const ids = new Set([...seen.value.keys(), ...props.people])
  return [...ids]
    .map((id) => ({ id, name: seen.value.get(id) || tasksText('tasksPage.person.unknown') }))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
}

function onDocumentClick(event: MouseEvent): void {
  if (!root.value?.contains(event.target as Node)) close(false)
}

function close(returnFocus: boolean): void {
  if (!open.value) return
  open.value = false
  document.removeEventListener('click', onDocumentClick, true)
  if (returnFocus) void nextTick(() => trigger.value?.focus())
}

function toggle(): void {
  if (open.value) return close(true)
  open.value = true
  document.addEventListener('click', onDocumentClick, true)
}

function pick(id: string | null): void {
  if (id === null) return emit('update:people', [])
  const has = props.people.includes(id)
  if (!has && props.people.length >= MAX) return
  emit('update:people', has ? props.people.filter((p) => p !== id) : [...props.people, id])
}

onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick, true))
</script>

<template>
  <div ref="root" class="tasks-pop-anchor">
    <button
      ref="trigger"
      type="button"
      class="t-btn t-btn--secondary t-btn--sm tasks-filterbtn"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :disabled="locked"
      :title="locked ? tasksText('tasksPage.person.memberLens') : undefined"
      data-testid="person-filter"
      @click="toggle"
    >
      {{ tasksText('tasksPage.person.label') }}
      <UiCount v-if="people.length > 0" class="tasks-filterbtn__n" :value="String(people.length)" />
      <UiIcon name="chevron-down" size="sm" />
    </button>
    <UiMenu
      v-if="open"
      class="tasks-pop"
      :label="tasksText('tasksPage.person.menu')"
      @close="close(true)"
    >
      <UiMenuItem :checked="people.length === 0" @select="pick(null)">
        {{ tasksText('tasksPage.person.all') }}
      </UiMenuItem>
      <UiMenuItem
        v-for="o in options()"
        :key="o.id"
        multiple
        :checked="people.includes(o.id)"
        @select="pick(o.id)"
      >
        {{ o.name }}
      </UiMenuItem>
    </UiMenu>
  </div>
</template>
