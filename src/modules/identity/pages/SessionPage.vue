<script setup lang="ts">
// YER TUTUCU oturum görünümü (tasarımsız). Giriş ekranı tasarımı F09'dadır; bu sayfa yalnız
// http/oturum katmanının gerçek uygulama yığınından geçtiğini e2e ile kanıtlamak içindir.
import { onMounted, ref, watch } from 'vue'

import { toApiError, type ApiError } from '@/shared/errors/api-error'
import { useSessionStore } from '@/shared/session/store'

const session = useSessionStore()
const email = ref('')
const password = ref('')
const error = ref<ApiError | null>(null)
const busy = ref(false)

async function loadMe(): Promise<void> {
  try {
    await session.loadMe()
  } catch (e) {
    error.value = toApiError(e)
  }
}

async function submit(): Promise<void> {
  busy.value = true
  error.value = null
  try {
    await session.login({ email: email.value, password: password.value })
    password.value = ''
  } catch (e) {
    error.value = toApiError(e)
  } finally {
    busy.value = false
  }
}

async function logout(): Promise<void> {
  await session.logout()
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
  <section data-testid="session-page">
    <h1>NIZAM.IO</h1>
    <p data-testid="session-status">{{ session.status }}</p>

    <p v-if="session.status === 'ended'" data-testid="session-ended">oturum sonlandı</p>

    <form
      v-if="session.status === 'anonymous' || session.status === 'ended'"
      data-testid="login-form"
      @submit.prevent="submit"
    >
      <label
        >e-posta <input v-model="email" name="email" type="email" autocomplete="username"
      /></label>
      <label>
        parola
        <input v-model="password" name="password" type="password" autocomplete="current-password" />
      </label>
      <button type="submit" :disabled="busy">giriş</button>
    </form>

    <div v-if="session.status === 'authenticated'" data-testid="session-info">
      <p data-testid="me-email">{{ session.me?.email }}</p>
      <p v-if="session.forcePasswordChange" data-testid="force-password-change">
        parola değişimi gerekli
      </p>
      <button type="button" data-testid="logout" @click="logout">çıkış</button>
    </div>

    <p v-if="error" data-testid="error" role="alert">
      {{ error.messageKey }} <small>{{ error.requestId }}</small>
    </p>
  </section>
</template>
