<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  NOTIFICATION_PANEL_ID,
  NotificationPanel,
  useUnreadNotifications,
  type NotificationTarget,
} from '@/modules/notifications/public'
import { UiIcon } from '@/shared/ui'

import { bellTargetLocation } from './bell-target'
import { topbarText } from './messages'

/**
 * Bildirim zili (E-00-38, E-14-01): sayaç canlı (hesap geneli; kapsam değişince yeniden istenmez),
 * panel F7'de AÇIK: zil `aria-haspopup="dialog"` + `aria-expanded`; `aria-controls` yalnız panel
 * açıkken (KESİN 27). Panel gövdesi `NotificationPanel` yuvasındadır (W158 doldurur); satır
 * tıklaması `navigate(target)` olayıyla gelir, kabuk rotaya götürür ve paneli kapatır. Okunmamış
 * varken nokta; sayı yalnız erişim adında. `designStub` yok (BE-002 vazgeçildi — faz sırası).
 */
const { count } = useUnreadNotifications()
const router = useRouter()
const open = ref(false)
const unread = computed(() => (count.value !== null && count.value > 0 ? count.value : null))
const label = computed(() =>
  unread.value === null
    ? topbarText('topbar.bell')
    : topbarText('topbar.bellUnread', { n: unread.value }),
)

function navigate(target: NotificationTarget): void {
  open.value = false
  void router.push(bellTargetLocation(target))
}
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
    :title="topbarText('topbar.bellPanel')"
    @click="open = !open"
  >
    <UiIcon name="bell" size="sm" />
    <span v-if="unread !== null" class="topbar-bell__dot" aria-hidden="true" />
  </button>
  <NotificationPanel :open="open" @close="open = false" @navigate="navigate" />
</template>
