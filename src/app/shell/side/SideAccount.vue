<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { routeLocation } from '@/app/routes.catalog'
import { useSessionStore } from '@/shared/session/store'
import { UiAvatar, UiIconButton } from '@/shared/ui'

import { sideText } from './messages'
import { injectScopeLifecycle } from './scope-key'

/**
 * Oturum kartı (E-00-28) + çıkış (E-00-29). Kart tıklanamaz; ad/e-posta kırpılır. Çıkış onaysız:
 * `session.logout()` (bellek + önbellek + kapsam temizliği; başarısızsa "sunucu çıkışı
 * doğrulanamadı" bayrağı — uyarıyı kabuk gösterir, ortak-kurallar §8) → giriş ekranı.
 */
const lifecycle = injectScopeLifecycle()
const session = useSessionStore()
const queryClient = useQueryClient()
const router = useRouter()
const busy = ref(false)
const standing = computed(() => lifecycle.standing.value)

async function signOut(): Promise<void> {
  if (busy.value) return
  busy.value = true
  try {
    await session.logout(queryClient)
  } finally {
    busy.value = false
  }
  await router.push(routeLocation('identity.session', {}))
}
</script>

<template>
  <div v-if="standing" class="side-account">
    <UiAvatar :name="standing.fullName" />
    <span class="side-account__text">
      <span class="side-account__name rp-trunc">{{ standing.fullName }}</span>
      <span class="side-account__mail rp-trunc">{{ standing.email }}</span>
    </span>
    <UiIconButton
      icon="logout"
      :label="sideText('side.logout')"
      :disabled="busy"
      @click="signOut"
    />
  </div>
</template>
