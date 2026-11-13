<script setup lang="ts">
import { UiEmptyState } from '@/shared/ui'

import { homeText } from '../../model/messages'

/**
 * "Son bildirimler" (E-Ü1-23/24): sayaç canlı (`countUnreadNotifications`, hesap geneli); LİSTE
 * F7'dedir → nötr "Henüz bildirim yok · yakında" (sahte satır yok, §4; BE-002 backend eksiği
 * değil faz sırası → `designStub` yok). "Tümü" (Ü7) F6 dışı: açıklamalı devre dışı. Sayaç
 * okunamazsa "‹n› yeni" çizilmez (sayı uydurulmaz).
 */
defineProps<{ unread: number | null }>()
</script>

<template>
  <section
    class="t-card rh-card rh-card--aside"
    data-region="notifications"
    aria-labelledby="u1-notif"
  >
    <div class="rh-cardhead">
      <h2 id="u1-notif" class="rh-cardtitle">
        {{ homeText('home.u1.notifications.title') }}
        <span v-if="unread !== null && unread > 0" class="rh-pill rh-pill--ok" data-unread>
          {{ homeText('home.u1.notifications.unread', { n: unread }) }}
        </span>
      </h2>
      <span
        class="rh-link"
        aria-disabled="true"
        :title="homeText('home.u1.notifications.allLater')"
        data-testid="u1-notif-all"
      >
        {{ homeText('home.u1.notifications.all') }}
      </span>
    </div>
    <UiEmptyState
      :title="homeText('home.u1.notifications.empty')"
      :text="homeText('home.u1.notifications.soon')"
      icon="bell"
    />
  </section>
</template>
