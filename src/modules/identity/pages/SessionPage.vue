<script setup lang="ts">
// Oturum görünümü (giriş ekranı tasarımı yok; P3 en sade). Alanlar ve düğmeler `shared/ui`
// (`UiField` + `UiInput`, `UiButton`) ile kurulur: iki temada kenarlık, etiket ve boşluk token'dan
// (O4 görsel borç). Sayfa http/oturum katmanının gerçek yığından geçtiğini e2e ile de kanıtlar
// (`input[name]`, "Giriş" düğmesi, `data-testid`'ler e2e sözleşmesidir).
import { useQueryClient } from '@tanstack/vue-query'
import { useForm } from 'vee-validate'
import { nextTick, onMounted, ref, watch } from 'vue'

import { useI18n } from 'vue-i18n'

import { toApiError, type ApiError } from '@/shared/errors/api-error'
import { errorText } from '@/shared/i18n'
import { useSessionStore } from '@/shared/session/store'
import { firstInvalidIn, UiButton, UiCard, UiField, UiInput } from '@/shared/ui'

const session = useSessionStore()
const queryClient = useQueryClient()
const { t } = useI18n()
// İstemci doğrulaması (K11, F2 K-7): boş e-posta/parola sunucuya gitmez, alan hatası formda.
// Biçim ve doğruluk sunucudadır (`identity.credentials_invalid`); parola asla kırpılmaz.
interface Values {
  email: string
  password: string
}
const form = useForm<Values>({
  validationSchema: {
    email: (value: unknown) =>
      (typeof value === 'string' && value.trim() !== '') || t('terms.session.emailRequired'),
    password: (value: unknown) =>
      (typeof value === 'string' && value !== '') || t('terms.session.passwordRequired'),
  },
  initialValues: { email: '', password: '' },
})
const [email] = form.defineField('email')
const [password] = form.defineField('password')
const errors = form.errors
const root = ref<HTMLFormElement | null>(null)
const error = ref<ApiError | null>(null)
const busy = ref(false)

async function loadMe(): Promise<void> {
  error.value = null
  try {
    await session.loadMe()
  } catch (e) {
    error.value = toApiError(e)
  }
}

async function focusInvalid(): Promise<void> {
  await nextTick()
  if (root.value) firstInvalidIn(root.value)?.focus()
}

const handle = form.handleSubmit(
  async (values) => {
    if (busy.value) return
    busy.value = true
    error.value = null
    try {
      await session.login({ email: values.email.trim(), password: values.password })
      form.resetField('password', { value: '' })
    } catch (e) {
      error.value = toApiError(e)
    } finally {
      busy.value = false
    }
  },
  () => {
    error.value = null
    void focusInvalid()
  },
)

function submit(): void {
  void handle()
}

// Çıkış sorgu önbelleğini de boşaltır (W13 notu); doğrulanamayan çıkışın uyarısı uygulama
// kökünde (`app/states` LogoutUnverifiedNotice, ortak-kurallar §8).
async function logout(): Promise<void> {
  await session.logout(queryClient)
}

watch(
  () => session.status,
  (status) => {
    if (status === 'authenticated') void loadMe()
  },
)
onMounted(() => {
  if (session.status === 'authenticated') void loadMe()
})
</script>

<template>
  <section class="session-page" data-testid="session-page">
    <UiCard class="session-card" as="div">
      <h1 class="session-card__brand">NIZAM.IO</h1>
      <p class="session-card__status" data-testid="session-status" :data-status="session.status">
        {{ t(`terms.session.${session.status}`) }}
      </p>

      <UiButton
        v-if="session.status === 'unavailable'"
        data-testid="retry-bootstrap"
        @click="session.bootstrap()"
      >
        {{ t('terms.action.retry') }}
      </UiButton>

      <form
        v-if="session.status === 'anonymous' || session.status === 'ended'"
        ref="root"
        class="session-form"
        data-testid="login-form"
        novalidate
        @submit.prevent="submit"
      >
        <UiField label="E-posta" :error="errors.email">
          <UiInput v-model="email" name="email" type="email" autocomplete="username" />
        </UiField>
        <UiField label="Parola" :error="errors.password">
          <UiInput
            v-model="password"
            name="password"
            type="password"
            autocomplete="current-password"
          />
        </UiField>
        <UiButton type="submit" variant="primary" block :disabled="busy">Giriş</UiButton>
      </form>

      <div
        v-if="session.status === 'authenticated'"
        class="session-info"
        data-testid="session-info"
      >
        <p class="session-info__email" data-testid="me-email">{{ session.me?.email }}</p>
        <p v-if="session.forcePasswordChange" data-testid="force-password-change">
          Parola değişimi gerekli
        </p>
        <div class="session-info__actions">
          <UiButton data-testid="reload-me" @click="loadMe">
            {{ t('terms.action.refreshMe') }}
          </UiButton>
          <UiButton variant="ghost" data-testid="logout" @click="logout">Çıkış</UiButton>
        </div>
      </div>

      <p v-if="error" class="session-error" data-testid="error" role="alert">
        <span :data-code="error.code">{{ errorText(error) }}</span>
        <small v-if="error.requestId" class="session-error__id">({{ error.requestId }})</small>
      </p>
    </UiCard>
  </section>
</template>

<style>
/* Yalnız token; px yok. Kart genişliği dar sütun ölçüsü (`--rp-aside-max`). */
@layer components {
  .session-page {
    display: grid;
    place-items: center;
    min-height: 100vh;
    box-sizing: border-box;
    padding: var(--space-6) var(--space-4);
    background: var(--bg-base);
  }
  .session-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
    max-width: var(--rp-aside-max);
    box-sizing: border-box;
  }
  .session-card__brand {
    margin: 0;
    font: var(--text-heading-2);
    color: var(--ink);
  }
  .session-card__status,
  .session-info p {
    margin: 0;
    font: var(--text-body);
    color: var(--ink-muted);
  }
  .session-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  .session-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .session-info .session-info__email {
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  .session-info__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .session-error {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    margin: 0;
    font: var(--text-body);
    color: var(--danger);
  }
  .session-error__id {
    font: var(--text-caption);
    color: var(--ink-muted);
  }
}
</style>
