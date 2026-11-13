<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '@/app/layouts/AppShell.vue'
import ForcePasswordChange from '@/app/password/ForcePasswordChange.vue'
import PasswordChangedNotice from '@/app/password/PasswordChangedNotice.vue'
import { passwordChanged } from '@/app/password/password-flow'
import { routeLocation } from '@/app/routes.catalog'
import { sessionGate } from '@/app/session-gate'
import { safeNext } from '@/app/session-next'
import { LogoutUnverifiedNotice } from '@/app/states/public'
import UpdateRequired from '@/app/UpdateRequired.vue'
import { useInstanceStore } from '@/shared/instance/store'
import { useSessionStore } from '@/shared/session/store'

const instance = useInstanceStore()
const session = useSessionStore()
const route = useRoute()
const router = useRouter()

// Kabuk yalnız açık oturumda; parola değişimi gerekiyorsa kabuk gösterilmez (00-ortak
// `backend.md` §6: `identity.force_password_change_required` → parola ekranı).
const shell = computed(() => session.isAuthenticated && !session.forcePasswordChange)
// Zorunlu parola değişimi: hangi rota olursa olsun yalnız parola formu çizilir (P14; W83 K-1).
const mustChangePassword = computed(() => session.isAuthenticated && session.forcePasswordChange)

// Parola değişiminden sonraki açık giriş: bildirim kalkar, kullanıcı ana sayfaya döner.
watch(shell, (open) => {
  if (!open) return
  if (passwordChanged.value) {
    passwordChanged.value = false
    void router.replace(routeLocation('home', {}))
    return
  }
  // Kapının yönlendirdiği girişten sonra (`/oturum?next=…`): geldiği rotaya (yoksa ana sayfaya)
  // `replace` ile dönülür (W145 KUSUR 1). `next`siz `/oturum` ziyareti S0'da kalır.
  if (route.name !== 'identity.session' || route.query.next === undefined) return
  const next = safeNext(route.query.next, router)
  void router.replace(next ?? routeLocation('home', {}))
})

// Oturum açık değilken S0 dışı rota (ör. `/`) içerik göstermez; oturum sayfasına gider.
const gate = computed(() =>
  sessionGate({
    status: session.status,
    shell: shell.value,
    routeScope: route.matched.length > 0 ? route.meta.scope : undefined,
  }),
)
watch(
  gate,
  (decision) => {
    if (decision !== 'to-session') return
    // Geldiği rota korunur (yalnız uygulama içi yol; ilk gezinmede `route` henüz çözülmemiş olabilir).
    const from = router.currentRoute.value.fullPath
    const next = safeNext(from, router)
    void router.replace(routeLocation('identity.session', {}, next ? { next } : {}))
  },
  { immediate: true },
)

// Açılış sırası: kurulum profili (api_version) → sessiz refresh (HttpOnly çerez).
onMounted(async () => {
  const status = await instance.load()
  if (status !== 'update_required') await session.bootstrap()
})
</script>

<template>
  <UpdateRequired v-if="instance.status === 'update_required'" />
  <AppShell v-else-if="shell">
    <RouterView />
  </AppShell>
  <main v-else-if="mustChangePassword">
    <ForcePasswordChange />
  </main>
  <main v-else>
    <LogoutUnverifiedNotice />
    <PasswordChangedNotice />
    <RouterView v-if="gate === 'render'" />
  </main>
</template>
