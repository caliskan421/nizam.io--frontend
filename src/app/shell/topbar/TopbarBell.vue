<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import {
  NOTIFICATION_PANEL_ID,
  NotificationPanel,
  notificationText,
  useUnreadNotifications,
} from '@/modules/notifications/public'
import { UiIcon } from '@/shared/ui'

import { useBellNavigation } from './use-bell-navigation'

/**
 * Bildirim zili (E-00-38, E-14-01…08): sayaç canlı (hesap geneli; kapsam değişince yeniden
 * istenmez). Durumlar: yok → rozet çizilmez; 1–9 → sayılı rozet; ≥10 → "9+"; sayaç okunamadı →
 * rozet gizli, zil etkin (sahte "0" yok). Sayı erişim adında da yazılır ve değişimi `aria-live`
 * bölgesinde duyurulur. Bilgi noktası (BE-144) ve sessiz saat (BE-153) çizilmez. Zil
 * `aria-haspopup="dialog"` + `aria-expanded`; `aria-controls` yalnız panel açıkken (KESİN 27).
 * Satır tıklaması `navigate(target)` ile gelir; kabuk rotaya götürür ve paneli kapatır, rota
 * başka yoldan değişirse panel kapanır (E-14-22).
 */
const OVERFLOW_AT = 9
const { count } = useUnreadNotifications()
const route = useRoute()
const open = ref(false)
const unread = computed(() => (count.value !== null && count.value > 0 ? count.value : null))
const overflow = computed(() => unread.value !== null && unread.value > OVERFLOW_AT)
const badge = computed(() =>
  unread.value === null
    ? null
    : overflow.value
      ? notificationText('notifications.bell.badgeOverflow')
      : String(unread.value),
)
const label = computed(() => {
  if (unread.value === null) return notificationText('notifications.bell.label')
  return overflow.value
    ? notificationText('notifications.bell.overflow')
    : notificationText('notifications.bell.unread', { n: unread.value })
})
const live = computed(() =>
  unread.value === null ? '' : notificationText('notifications.bell.live', { n: unread.value }),
)

watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)

const navigate = useBellNavigation(() => {
  open.value = false
})
</script>

<template>
  <button
    class="t-iconbtn topbar-bell"
    type="button"
    data-testid="topbar-bell"
    aria-haspopup="dialog"
    :aria-expanded="open ? 'true' : 'false'"
    :aria-controls="open ? NOTIFICATION_PANEL_ID : undefined"
    :aria-label="label"
    :title="notificationText(open ? 'notifications.bell.close' : 'notifications.bell.open')"
    @click="open = !open"
  >
    <UiIcon name="bell" size="sm" />
    <span v-if="badge !== null" class="topbar-bell__badge" aria-hidden="true">{{ badge }}</span>
  </button>
  <span class="rp-sr" role="status" aria-live="polite" data-testid="topbar-bell-live">{{
    live
  }}</span>
  <NotificationPanel :open="open" @close="open = false" @navigate="(t) => navigate(t)" />
</template>
