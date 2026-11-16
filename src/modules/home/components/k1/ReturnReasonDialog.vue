<script setup lang="ts">
import { ref, useId, watch } from 'vue'

import { UiButton, UiField, UiModal } from '@/shared/ui'

import { homeText } from '../../model/messages'
import { checkReturnReason } from '../../model/role/return-reason'

/**
 * İade gerekçesi (E-K1-17/18; BE-139, WORK-K96): "İade et" önce bu pencereyi açar. Gerekçe İSTEĞE
 * BAĞLIDIR: boş gönderim gerekçesiz iade eder; doluysa 3–500 karakter. P3: tek alanlı en sade
 * pencere. Gönderimde pencere kapanır, yazma çağıranın `useRoleWrites` hattındadır (sonuç ve hata
 * bildirimleri orada). İstek sürerken pencere kapatılamaz.
 */
const props = defineProps<{ title: string; pending?: boolean }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ submit: [reason: string | null] }>()

const formId = `k1-return-${useId()}`
const reason = ref('')
const invalid = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return
  reason.value = ''
  invalid.value = false
})

function onSubmit(): void {
  if (props.pending) return
  const checked = checkReturnReason(reason.value)
  if (!checked.ok) {
    invalid.value = true
    return
  }
  emit('submit', checked.reason)
}
</script>

<template>
  <UiModal
    v-model:open="open"
    :title="homeText('home.k1.returnDialog.title')"
    :description="homeText('home.k1.returnDialog.description', { title })"
    :dismissible="!pending"
  >
    <form :id="formId" class="rh-form" novalidate @submit.prevent="onSubmit">
      <UiField
        :label="homeText('home.k1.returnDialog.label')"
        :error="invalid ? homeText('home.k1.returnDialog.error') : undefined"
      >
        <template #default="{ id, describedBy, invalid: bad }">
          <textarea
            :id="id"
            v-model="reason"
            class="rh-textarea"
            data-testid="k1-return-input"
            :aria-describedby="describedBy"
            :aria-invalid="bad ? 'true' : undefined"
            :disabled="pending"
            @input="invalid = false"
          />
        </template>
      </UiField>
    </form>
    <template #footer>
      <UiButton :disabled="pending" data-testid="k1-return-cancel" @click="open = false">
        {{ homeText('home.k1.returnDialog.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        :form="formId"
        :disabled="pending"
        data-testid="k1-return-submit"
      >
        {{ homeText('home.k1.returnDialog.submit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
