<script setup lang="ts">
import { computed, onMounted } from 'vue'

import AppShell from '@/app/layouts/AppShell.vue'
import { LogoutUnverifiedNotice } from '@/app/states/public'
import UpdateRequired from '@/app/UpdateRequired.vue'
import { useInstanceStore } from '@/shared/instance/store'
import { useSessionStore } from '@/shared/session/store'

const instance = useInstanceStore()
const session = useSessionStore()

// Kabuk yalnız açık oturumda; parola değişimi gerekiyorsa kabuk gösterilmez (00-ortak
// `backend.md` §6: `identity.force_password_change_required` → parola ekranı).
const shell = computed(() => session.isAuthenticated && !session.forcePasswordChange)

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
    <RouterView />
  </main>
</template>
