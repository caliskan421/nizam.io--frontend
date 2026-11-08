<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '@/app/layouts/AppShell.vue'
import { routeLocation } from '@/app/routes.catalog'
import { sessionGate } from '@/app/session-gate'
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
    if (decision === 'to-session') void router.replace(routeLocation('identity.session', {}))
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
  <main v-else>
    <LogoutUnverifiedNotice />
    <RouterView v-if="gate === 'render'" />
  </main>
</template>
