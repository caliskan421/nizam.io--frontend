<script setup lang="ts">
import './password.css'

import { useQueryClient } from '@tanstack/vue-query'
import { useForm } from 'vee-validate'
import { nextTick, ref, shallowRef } from 'vue'

import { statesText } from '@/app/states/messages'
import type { ApiError } from '@/shared/errors/api-error'
import { isDetached } from '@/shared/http/mutation'
import { errorText } from '@/shared/i18n'
import { useSessionStore } from '@/shared/session/store'
import { firstInvalidIn, UiButton, UiCard, UiField, UiInput } from '@/shared/ui'
import { outcomeText } from '@/shared/ui/confirm'

import { passwordChanged } from './password-flow'
import { useChangePassword } from './use-change-password'

/**
 * Zorunlu parola değişimi (P14: yöneticinin verdiği geçici parola ilk girişte değiştirilir;
 * 00-ortak `backend.md` §6: `identity.force_password_change_required` → parola ekranı, kabuk
 * gösterilmez). Uygulama kökü oturum açık ve bayrak kalkık iken her rotada bunu çizer.
 *
 *  - İstemci kuralı yalnız "boş olamaz" ve tekrarın eşleşmesi; parola kuralları sunucudadır
 *    (422 `identity.input_invalid` `fields[]` → ilgili alana; 401 `identity.credentials_invalid`
 *    → mevcut parola alanına). Sunucu `message` alanı gösterilmez.
 *  - Parolalar yalnız form belleğinde: her sonuçta alanlar boşaltılır; mutasyon önbelleğe girmez.
 *  - Başarı: sunucu bütün oturumları düşürdü ve çerezi temizledi → oturum yerelde kapanır, giriş
 *    ekranı "yeni parolanızla giriş yapın" der; yeni girişte bayrak kalkık gelir, ana sayfaya
 *    dönülür ve kabuk kapsamı (standing) yeniden okur.
 */
interface Values {
  current: string
  next: string
  repeat: string
}
const EMPTY: Values = { current: '', next: '', repeat: '' }

const session = useSessionStore()
const queryClient = useQueryClient()
const mutation = useChangePassword()

const required = (value: unknown) =>
  (typeof value === 'string' && value !== '') || statesText('states.password.required')

const form = useForm<Values>({
  validationSchema: {
    current: required,
    next: required,
    repeat: (value: unknown, ctx: { form: Record<string, unknown> }) => {
      const filled = required(value)
      if (filled !== true) return filled
      return value === ctx.form.next || statesText('states.password.mismatch')
    },
  },
  initialValues: { ...EMPTY },
})
const [current] = form.defineField('current')
const [next] = form.defineField('next')
const [repeat] = form.defineField('repeat')
const errors = form.errors
const failure = shallowRef<string | null>(null)
const root = ref<HTMLFormElement | null>(null)

function wipe(): void {
  form.resetForm({ values: { ...EMPTY } })
}

async function focusInvalid(): Promise<void> {
  await nextTick()
  if (root.value) firstInvalidIn(root.value)?.focus()
}

const PASSWORD_FIELD_CODES = new Set([
  'identity.password_needs_digit',
  'identity.password_needs_lower',
  'identity.password_needs_upper',
  'identity.password_too_short',
  'identity.weak_password',
])

function fieldErrors(error: ApiError): Partial<Record<keyof Values, string>> {
  if (error.code === 'identity.credentials_invalid') {
    return { current: statesText('states.password.currentInvalid') }
  }
  const out: Partial<Record<keyof Values, string>> = {}
  for (const f of error.fields) {
    const target =
      f.field === 'current_password'
        ? 'current'
        : f.field === 'new_password' || PASSWORD_FIELD_CODES.has(f.code)
          ? 'next'
          : null
    if (target && !out[target]) out[target] = errorText(f)
  }
  return out
}

const handle = form.handleSubmit(
  async (values) => {
    failure.value = null
    const outcome = await mutation.submit({ current: values.current, next: values.next })
    wipe()
    if (outcome.kind === 'owner_disposed' || isDetached(outcome)) return
    if (outcome.kind === 'success') {
      passwordChanged.value = true
      session.endAfterPasswordChange(queryClient)
      return
    }
    if (outcome.kind === 'failed') {
      const found = fieldErrors(outcome.error)
      if (Object.keys(found).length > 0) {
        form.setErrors(found)
        await focusInvalid()
        return
      }
    }
    failure.value = outcomeText(outcome)
  },
  () => {
    void focusInvalid()
  },
)

function submit(): void {
  if (mutation.isPending.value) return
  void handle()
}

async function logout(): Promise<void> {
  wipe()
  await session.logout(queryClient)
}
</script>

<template>
  <section class="pw-page" data-testid="force-password-change">
    <UiCard class="pw-card" as="div">
      <h1 class="pw-card__title">{{ statesText('states.password.title') }}</h1>
      <p class="pw-card__intro">{{ statesText('states.password.intro') }}</p>
      <form
        ref="root"
        class="pw-form"
        data-testid="force-password-form"
        novalidate
        @submit.prevent="submit"
      >
        <UiField :label="statesText('states.password.current')" :error="errors.current">
          <UiInput
            v-model="current"
            type="password"
            name="current_password"
            autocomplete="current-password"
          />
        </UiField>
        <UiField :label="statesText('states.password.next')" :error="errors.next">
          <UiInput v-model="next" type="password" name="new_password" autocomplete="new-password" />
        </UiField>
        <UiField :label="statesText('states.password.repeat')" :error="errors.repeat">
          <UiInput
            v-model="repeat"
            type="password"
            name="repeat_password"
            autocomplete="new-password"
          />
        </UiField>
        <p v-if="failure" class="pw-card__error" role="alert" data-testid="force-password-error">
          {{ failure }}
        </p>
        <div class="pw-form__actions">
          <UiButton
            type="submit"
            variant="primary"
            :disabled="mutation.isPending.value"
            data-testid="force-password-submit"
          >
            {{ statesText('states.password.submit') }}
          </UiButton>
          <UiButton variant="ghost" data-testid="force-password-logout" @click="logout">
            {{ statesText('states.password.logout') }}
          </UiButton>
        </div>
      </form>
    </UiCard>
  </section>
</template>
