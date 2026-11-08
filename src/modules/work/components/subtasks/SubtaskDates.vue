<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import { UiButton, UiIcon } from '@/shared/ui'

import type { UpdateSubtaskBody, WorkItemSubtask } from '../../model/types'
import { subtaskText } from './messages'
import { dateRangeLabel, datesChange, datesProblem } from './subtask-format'

/**
 * Tarih yuvası + açılırı (E-03-34; `ozellikler.md` §3-B): `rp-pop` `role="dialog"`, iki
 * `type="date"` (bitişin `min`'i başlangıç), "Tarihi kaldır" / "Tamam". Değer değişiminde istek
 * YOK; yalnız "Tamam" (değişiklik varsa) ya da "Tarihi kaldır" (tarih varsa) tek yazma yayar.
 * İkisi birlikte girilir (sözleşme). Ana görev aralığı sınırı yok (ADR-0024, BE-020 — F3).
 * Esc / odağın açılırdan çıkması kapatır. Yetkisizde (s.146) salt metin.
 */
const props = defineProps<{
  subtask: WorkItemSubtask
  editable: boolean
  open: boolean
  busy: boolean
}>()
const emit = defineEmits<{ open: [value: boolean]; save: [changes: UpdateSubtaskBody] }>()

const start = ref('')
const end = ref('')
const trigger = ref<HTMLButtonElement | null>(null)
const root = ref<HTMLElement | null>(null)
const label = computed(() => dateRangeLabel(props.subtask) ?? subtaskText('subtasks.row.dateNone'))
const problem = computed(() => datesProblem(start.value, end.value))

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    start.value = props.subtask.start_on ?? ''
    end.value = props.subtask.end_on ?? ''
  },
  { immediate: true },
)

function close(focusTrigger: boolean): void {
  emit('open', false)
  if (focusTrigger) void nextTick(() => trigger.value?.focus())
}

function confirmDates(): void {
  if (problem.value !== null) return
  const changes = datesChange(props.subtask, start.value, end.value)
  close(true)
  if (changes) emit('save', changes)
}

function clearDates(): void {
  close(true)
  if (props.subtask.start_on || props.subtask.end_on) emit('save', { start_on: '', end_on: '' })
}

function onFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (props.open && next && !root.value?.contains(next)) close(false)
}
</script>

<template>
  <div v-if="editable" ref="root" class="sub-cell" @focusout="onFocusOut">
    <button
      ref="trigger"
      type="button"
      class="rp-subslot"
      :title="label"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="dialog"
      :disabled="busy"
      data-testid="subtask-dates"
      @click="emit('open', !open)"
    >
      <UiIcon name="calendar" size="sm" />
      <span class="rp-trunc">{{ label }}</span>
    </button>
    <div
      v-if="open"
      class="rp-pop sub-pop sub-pop--date"
      role="dialog"
      :aria-label="subtaskText('subtasks.date.label')"
      data-testid="subtask-dates-pop"
      @keydown.esc.stop.prevent="close(true)"
    >
      <div class="rp-dr">
        <label>
          {{ subtaskText('subtasks.date.start') }}
          <input v-model="start" class="t-input" type="date" data-testid="subtask-start" />
        </label>
        <label>
          {{ subtaskText('subtasks.date.end') }}
          <input
            v-model="end"
            class="t-input"
            type="date"
            :min="start || undefined"
            data-testid="subtask-end"
          />
        </label>
      </div>
      <p v-if="problem" class="sub-pop__hint" role="alert">
        {{ subtaskText(`subtasks.date.${problem}`) }}
      </p>
      <div class="sub-pop__actions">
        <UiButton size="sm" data-testid="subtask-dates-clear" @click="clearDates">
          {{ subtaskText('subtasks.date.clear') }}
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :disabled="problem !== null"
          data-testid="subtask-dates-ok"
          @click="confirmDates"
        >
          {{ subtaskText('subtasks.date.ok') }}
        </UiButton>
      </div>
    </div>
  </div>
  <span v-else class="rp-subslot" :title="label" data-testid="subtask-dates-text">
    <UiIcon name="calendar" size="sm" />
    <span class="rp-trunc">{{ label }}</span>
  </span>
</template>
