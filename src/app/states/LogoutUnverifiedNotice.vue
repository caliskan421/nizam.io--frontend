<script setup lang="ts">
import './states.css'

import { OPEN_STATES } from '@/app/routes.catalog'
import { useSessionStore } from '@/shared/session/store'
import { UiIcon } from '@/shared/ui'

import { statesText } from './messages'

/**
 * "Sunucu çıkışı doğrulanamadı" (ortak-kurallar §8, CX-S-10): çıkış isteği başarısız / zaman
 * aşımı olduysa giriş ekranında kısa uyarı. Bayrak yalnız bellektedir (sayfa yenilemede kalkar);
 * açık girişe kadar sessiz yenileme denenmez (oturum katmanı).
 */
const session = useSessionStore()
</script>

<template>
  <p
    v-if="session.serverLogoutUnverified"
    class="shell-notice"
    role="status"
    data-testid="logout-unverified"
    :data-open-state="'state.logout-unverified'"
  >
    <UiIcon name="alert" size="sm" />
    <span>
      <strong class="rp-sr">{{ OPEN_STATES['state.logout-unverified'].title }}: </strong>
      {{ statesText('states.logoutUnverified') }}
    </span>
  </p>
</template>
