<script setup lang="ts">
import './forms.css'

import { computed, ref, watch } from 'vue'

import { UiButton, UiField, UiInput, UiModal } from '@/shared/ui'

import { checkReturnReason, isValidReason } from '../../model/transitions'
import { formsText } from './messages'

/**
 * Geri alma gerekçesi (E-03-58; `tamamlandi → devam_ediyor`, `reason` ≥ 3 bayt — §5). P3: tek
 * alanlı en sade pencere. Geçersiz gerekçe gönderilmez (istemci denetimi; sunucu yine 422
 * `work.revert_reason_required` dönebilir). İstek sürerken pencere kapatılamaz. `variant="return"`: iade gerekçesi (BE-139) — isteğe bağlı,
 * boşsa gerekçesiz iade; doluysa 3–500 karakter.
 */
const props = withDefaults(defineProps<{ pending?: boolean; variant?: 'revert' | 'return' }>(), {
  pending: false,
  variant: 'revert',
})
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ submit: [reason: string] }>()

const reason = ref('')
const key = computed(() => (props.variant === 'return' ? 'returnReason' : 'reason'))
const error = ref<string | undefined>(undefined)

watch(open, (isOpen) => {
  if (!isOpen) return
  reason.value = ''
  error.value = undefined
})

function onSubmit(): void {
  if (props.pending) return
  const valid =
    props.variant === 'return' ? checkReturnReason(reason.value).ok : isValidReason(reason.value)
  if (!valid) {
    error.value = formsText(
      props.variant === 'return'
        ? 'workForms.transition.returnReason.error'
        : 'workForms.transition.reason.error',
    )
    return
  }
  emit('submit', reason.value)
}

function cancel(): void {
  if (!props.pending) open.value = false
}
</script>

<template>
  <UiModal
    v-model:open="open"
    :title="formsText(`workForms.transition.${key}.title`)"
    :description="formsText(`workForms.transition.${key}.description`)"
    :dismissible="!pending"
  >
    <form id="wf-revert" class="wf-form" novalidate @submit.prevent="onSubmit">
      <UiField :label="formsText(`workForms.transition.${key}.label`)" :error="error">
        <UiInput v-model="reason" name="reason" @update:model-value="error = undefined" />
      </UiField>
    </form>
    <template #footer>
      <UiButton variant="ghost" :disabled="pending" @click="cancel">
        {{ formsText('workForms.create.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        form="wf-revert"
        :disabled="pending"
        data-testid="wf-revert-submit"
      >
        {{ formsText(`workForms.transition.${key}.submit`) }}
      </UiButton>
    </template>
  </UiModal>
</template>
