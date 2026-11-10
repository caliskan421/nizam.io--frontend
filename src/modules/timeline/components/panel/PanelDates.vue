<script setup lang="ts">
import { useId } from 'vue'

import type { DateInputError } from './date-input'
import { panelText } from './messages'

/**
 * E-03C-58/59 — başlangıç/bitiş girdileri (`gg.aa.yyyy`). Düzenleme yetkisi yoksa salt okunur
 * (Üye); gecikmedeki görevde bitiş kenarı `--danger` (durum göstergesi, doğrulama hatası değil).
 */
defineProps<{
  editable: boolean
  late: boolean
  startError: DateInputError | null
  endError: DateInputError | null
}>()
const start = defineModel<string>('start', { required: true })
const end = defineModel<string>('end', { required: true })
const emit = defineEmits<{ edit: [] }>()
const uid = useId()
</script>

<template>
  <div class="tp-dates">
    <div class="tp-date">
      <label class="tp-kicker" :for="`${uid}-start`">{{ panelText('start') }}</label>
      <input
        :id="`${uid}-start`"
        v-model="start"
        class="t-input tp-mono"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :readonly="!editable"
        :placeholder="panelText('datePlaceholder')"
        :aria-invalid="startError ? 'true' : undefined"
        :aria-describedby="startError ? `${uid}-start-err` : undefined"
        data-testid="tp-start"
        @input="emit('edit')"
      />
      <p v-if="startError" :id="`${uid}-start-err`" class="tp-date__error" role="alert">
        {{ panelText(`errors.${startError}`) }}
      </p>
    </div>
    <div class="tp-date" :class="{ 'tp-date--late': late }">
      <label class="tp-kicker" :for="`${uid}-end`">{{ panelText('end') }}</label>
      <input
        :id="`${uid}-end`"
        v-model="end"
        class="t-input tp-mono"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :readonly="!editable"
        :placeholder="panelText('datePlaceholder')"
        :aria-invalid="endError ? 'true' : undefined"
        :aria-describedby="endError ? `${uid}-end-err` : undefined"
        data-testid="tp-end"
        @input="emit('edit')"
      />
      <p v-if="endError" :id="`${uid}-end-err`" class="tp-date__error" role="alert">
        {{ panelText(`errors.${endError}`) }}
      </p>
    </div>
  </div>
</template>
