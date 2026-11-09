<script setup lang="ts">
import './forms.css'

import { useForm } from 'vee-validate'
import { computed, shallowRef, watch } from 'vue'
import { z } from 'zod'

import type { MutationOutcome } from '@/shared/http/mutation'
import { notifyOutcome, UiOutcomeNotice } from '@/shared/ui/confirm'
import { UiButton, UiField, UiInput, UiModal, useToast } from '@/shared/ui'

import { useSetTemporaryPassword } from '../../api'
import type { TemporaryPasswordDialogEmits, TemporaryPasswordDialogProps } from '../index'
import { serverFieldErrors, toTypedSchema, useFormDialog } from './form-kit'
import { orgText } from './messages'

/**
 * W74 · 05 satır dışı "Geçici parola belirle" (P14; `updateAccount {password,
 * force_password_change: true}`, yalnız ŞY). Parola YALNIZ bu formun belleğindedir: her sonuçta,
 * kapanışta ve açılışta alan boşaltılır; `done` parolayı taşımaz; mutasyon önbellekte tutulmaz ve
 * sonuç taslağı parolasızdır (veri katmanı, W71). Alan hataları (`identity.password_*`) alana.
 */
const props = defineProps<TemporaryPasswordDialogProps>()
const emit = defineEmits<TemporaryPasswordDialogEmits>()

interface Values {
  password: string
}
const EMPTY: Values = { password: '' }

const mutation = useSetTemporaryPassword()
const form = useForm<Values>({
  validationSchema: toTypedSchema<Values, Values>(
    z.object({ password: z.string().min(1, orgText('organization.forms.password.required')) }),
  ),
  initialValues: EMPTY,
})
const [password] = form.defineField('password')
const errors = form.errors
const notice = shallowRef<MutationOutcome<unknown, unknown, unknown> | null>(null)

const dialog = useFormDialog({ open: () => props.open, close })
const pending = computed(() => dialog.busy.value || mutation.isPending.value)

function wipe(): void {
  form.resetForm({ values: { ...EMPTY } })
}

watch(
  () => props.open,
  () => {
    wipe()
    notice.value = null
  },
)

function close(): void {
  wipe()
  emit('update:open', false)
}

function setOpen(value: boolean): void {
  if (!value && pending.value) return
  if (!value) close()
}

const handle = form.handleSubmit(async (values) => {
  notice.value = null
  const outcome = await mutation.submit({ accountId: props.accountId, password: values.password })
  wipe()
  if (!dialog.alive() || outcome.kind === 'owner_disposed') return
  if (outcome.kind === 'success') {
    const count = outcome.data.revoked_sessions ?? 0
    useToast().push({
      message:
        count > 0
          ? orgText('organization.forms.password.doneRevoked', { count })
          : orgText('organization.forms.password.done'),
    })
    emit('done')
    close()
    return
  }
  if (outcome.kind === 'failed') {
    const fieldErrors = serverFieldErrors(outcome.error, { password: 'password' as const })
    if (fieldErrors.password) return form.setErrors(fieldErrors)
  }
  if (outcome.kind === 'unknown_outcome') {
    notice.value = outcome
    return
  }
  notifyOutcome(outcome)
})

function submit(): void {
  void dialog.once(() => handle())
}
</script>

<template>
  <UiModal
    :open="open"
    :title="orgText('organization.forms.password.title')"
    :description="orgText('organization.forms.password.description')"
    :dismissible="!pending"
    @update:open="setOpen"
  >
    <form id="of-temp-password" class="of-form" novalidate @submit.prevent="submit">
      <UiField :label="orgText('organization.forms.password.field')" :error="errors.password">
        <UiInput v-model="password" type="password" name="password" autocomplete="new-password" />
      </UiField>
      <UiOutcomeNotice :outcome="notice" />
    </form>
    <template #footer>
      <UiButton variant="ghost" :disabled="pending" @click="setOpen(false)">
        {{ orgText('organization.forms.common.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        form="of-temp-password"
        :disabled="pending"
        data-testid="of-submit"
      >
        {{ orgText('organization.forms.password.submit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
