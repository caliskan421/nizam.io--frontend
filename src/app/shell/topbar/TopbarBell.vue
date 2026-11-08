<script setup lang="ts">
import { computed } from 'vue'

import { UiIcon } from '@/shared/ui'

import { useUnreadNotifications } from '../side/public'
import { topbarText } from './messages'

/**
 * Bildirim zili (E-00-38): sayaç canlı (hesap geneli; kapsam değişince yeniden istenmez), panel
 * F7'ye kadar devre dışı (ortak-kurallar §5; tıklanabilir ama işlevsiz kontrol yok). `designStub`
 * yok (BE-002 vazgeçildi — faz sırası). Okunmamış varken nokta; sayı yalnız erişim adında.
 */
const { count } = useUnreadNotifications()
const unread = computed(() => (count.value !== null && count.value > 0 ? count.value : null))
const label = computed(() =>
  unread.value === null
    ? topbarText('topbar.bell')
    : topbarText('topbar.bellUnread', { n: unread.value }),
)
</script>

<template>
  <button
    class="t-iconbtn topbar-bell"
    type="button"
    data-testid="topbar-bell"
    disabled
    :aria-label="label"
    :title="topbarText('topbar.bellPanelLater')"
  >
    <UiIcon name="bell" size="sm" />
    <span v-if="unread !== null" class="topbar-bell__dot" aria-hidden="true" />
  </button>
</template>
