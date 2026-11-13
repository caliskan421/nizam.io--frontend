<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { routeLocation } from '@/app/routes.catalog'
import { useSessionStore } from '@/shared/session/store'
import { UiAvatar, UiIconButton } from '@/shared/ui'

import type { MenuRole } from './menu-definition'
import { sideText } from './messages'
import { injectScopeLifecycle } from './scope-key'

/**
 * Oturum kartı (E-00-28, F6 E-00-47) + çıkış (E-00-29). Avatar çevresinde rol halkası ve ikinci
 * satırda rol etiketi canlıdır (menü rolü; yetki değil); profil sayfası (Ü7) F6 dışı olduğundan
 * kart tıklanamaz ("Profilim" yok). Ad/e-posta kırpılır. Çıkış onaysız:
 * `session.logout()` (bellek + önbellek + kapsam temizliği; başarısızsa "sunucu çıkışı
 * doğrulanamadı" bayrağı — uyarıyı kabuk gösterir, ortak-kurallar §8) → giriş ekranı.
 */
const props = defineProps<{ role: MenuRole }>()
const lifecycle = injectScopeLifecycle()
const session = useSessionStore()
const queryClient = useQueryClient()
const router = useRouter()
const busy = ref(false)
const standing = computed(() => lifecycle.standing.value)
const roleLabel = computed(() => sideText(`side.lens.${props.role}`))

async function signOut(): Promise<void> {
  if (busy.value) return
  busy.value = true
  try {
    await session.logout(queryClient)
  } finally {
    busy.value = false
  }
  // Çıkıştan sonraki giriş ana sayfaya döner (W145 KUSUR 1).
  await router.push(routeLocation('identity.session', {}, { next: '/' }))
}
</script>

<template>
  <div v-if="standing" class="side-account">
    <UiAvatar :name="standing.fullName" :class="`side-ring side-ring--${role}`" />
    <span class="side-account__text">
      <span class="side-account__name rp-trunc">{{ standing.fullName }}</span>
      <span class="side-account__mail rp-trunc" :title="standing.email"
        >{{ roleLabel }} · {{ standing.email }}</span
      >
    </span>
    <UiIconButton
      icon="logout"
      :label="sideText('side.logout')"
      :disabled="busy"
      @click="signOut"
    />
  </div>
</template>
