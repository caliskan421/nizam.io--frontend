<script setup lang="ts">
import './panel.css'

import { computed } from 'vue'

import { UiButton, UiField, UiInput, UiModal } from '@/shared/ui'

import type { DateRequestFormEmits, DateRequestFormProps } from '../index'
import { panelText } from './messages'
import { useDateRequestForm } from './use-date-request-form'

/**
 * W94 · E-03C-64, 03 E-03-54/63 — tarih talebi formu (03 ve 03c AYNI bileşen; çizilmemiş, P3:
 * `shared/ui` penceresi, en sade yerleşim). `requestDateChange`: iki tarih zorunlu, gerekçe
 * isteğe bağlı; Gönder istek sürerken kilitli (anahtarsız uçta çift gönderim yok). Açılış
 * değerleri `startOn`/`endOn`'dur; "değişmedi" denetimi taze görevin tarihleriyle yapılır.
 */
const props = defineProps<DateRequestFormProps>()
const emit = defineEmits<DateRequestFormEmits>()
const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

const form = useDateRequestForm(props, isOpen, (requestId) => emit('sent', requestId))
const formId = 'tp-request-form'
</script>

<template>
  <UiModal
    v-model:open="isOpen"
    :title="panelText('request.title')"
    :description="panelText('request.description')"
    :dismissible="!form.pending.value"
  >
    <form :id="formId" class="tp-form" novalidate @submit.prevent="form.submit">
      <p class="tp-form__current" data-testid="tp-request-current">
        {{ panelText('request.current', { range: form.currentRange.value }) }}
      </p>
      <div class="tp-form__row">
        <UiField :label="panelText('request.start')" :error="form.errors.value.start">
          <UiInput
            v-model="form.start.value"
            name="start"
            class="tp-mono"
            :placeholder="panelText('datePlaceholder')"
          />
        </UiField>
        <UiField :label="panelText('request.end')" :error="form.errors.value.end">
          <UiInput
            v-model="form.end.value"
            name="end"
            class="tp-mono"
            :placeholder="panelText('datePlaceholder')"
          />
        </UiField>
      </div>
      <UiField :label="panelText('request.reason')" :hint="panelText('request.reasonHint')">
        <UiInput v-model="form.reason.value" name="reason" />
      </UiField>
      <p
        v-if="form.formError.value"
        class="tp-form__error"
        role="alert"
        data-testid="tp-request-error"
      >
        {{ form.formError.value }}
      </p>
    </form>
    <template #footer>
      <UiButton variant="ghost" :disabled="form.pending.value" @click="isOpen = false">
        {{ panelText('request.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        :form="formId"
        :disabled="form.pending.value"
        data-testid="tp-request-submit"
      >
        {{ panelText('request.submit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
