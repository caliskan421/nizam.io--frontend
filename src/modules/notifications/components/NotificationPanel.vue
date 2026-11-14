<script setup lang="ts">
/**
 * Bildirim paneli (E-14-09…24; 1b–1d). Zile hizalı açılır panel, `role="dialog"`; geniş ekranda
 * modal DEĞİL (odak tuzağı yok, Tab panelden çıkar), dar ekranda (≤ `--rp-narrow-max`, P62) tam
 * ekran modal: `aria-modal`, odak tuzağı, kaydırma kilidi. Kapanış: Esc, ✕, dış tık (`close`
 * olayı); odak her kapanışta zile (yoksa önceki odağa) döner (KESİN 27). Kapsam/oturum değişince
 * `close` yayılır. Liste yalnız AÇIKKEN okunur; sekme süzgeci istemcidedir (uçta süzgeç yok).
 * Web Push kutusu yuvası (`PushOptInCard`, W159 gövdesi) listenin sonundadır.
 */
import './notifications.css'

import { computed, ref } from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import {
  UiButton,
  UiEmptyState,
  UiErrorState,
  UiIconButton,
  UiTabs,
  type UiChoiceOption,
} from '@/shared/ui'

import { notificationText } from '../messages'
import { NOTIFICATION_PANEL_ID } from '../model/panel'
import { AWAITING_TAB } from '../model/stubs'
import type { NotificationTarget } from '../model/target'
import NotificationRow from './NotificationRow.vue'
import PushOptInCard from './PushOptInCard.vue'
import { useNotificationPanel, type PanelTab } from './use-notification-panel'
import { usePanelDismiss } from './use-panel-dismiss'

const props = defineProps<{
  /** Panel açık mı; kapalıyken liste okunmaz (E-14-18). */
  open: boolean
}>()

const emit = defineEmits<{
  /** Esc, dış tık, ✕ ya da gezinme sonrası kapanış isteği. */
  close: []
  /** Satır tıklaması: hedef rota (membership/bilinmeyen için gönderilmez). */
  navigate: [target: NotificationTarget]
}>()

const panel = useNotificationPanel({
  open: () => props.open,
  onNavigate: (target) => emit('navigate', target),
})
const root = ref<HTMLElement | null>(null)
const { narrow, onKeydown } = usePanelDismiss({
  open: () => props.open,
  root,
  close: () => emit('close'),
})
const GROUP_LABEL = {
  today: 'notifications.rows.groupToday',
  yesterday: 'notifications.rows.groupYesterday',
  older: 'notifications.rows.groupOlder',
} as const

const tabs = computed<UiChoiceOption<'awaiting' | PanelTab>[]>(() => [
  {
    value: 'awaiting',
    label: notificationText('notifications.panel.tabAwaiting'),
    count: notificationText('notifications.panel.soon'),
    disabled: !AWAITING_TAB.enabled,
  },
  { value: 'all', label: notificationText('notifications.panel.tabAll') },
  {
    value: 'unread',
    label: notificationText('notifications.panel.tabUnread'),
    ...(panel.unreadCount.value === null ? {} : { count: panel.unreadCount.value }),
  },
])
const tabModel = computed({
  get: () => panel.tab.value,
  set: (value: 'awaiting' | PanelTab) => {
    if (value !== 'awaiting') panel.tab.value = value
  },
})
const canMarkAll = computed(() => (panel.unreadCount.value ?? 0) > 0 && !panel.markAllBusy.value)
const listError = computed(() => toApiError(panel.error.value))
</script>

<template>
  <section
    v-if="open"
    :id="NOTIFICATION_PANEL_ID"
    ref="root"
    class="notification-panel nb-panel"
    role="dialog"
    :aria-modal="narrow ? 'true' : undefined"
    :aria-label="notificationText('notifications.panel.title')"
    tabindex="-1"
    data-testid="notification-panel"
    @keydown="onKeydown"
  >
    <header class="nb-ph">
      <h3>{{ notificationText('notifications.panel.title') }}</h3>
      <div class="nb-ph__acts">
        <UiButton
          variant="ghost"
          size="sm"
          :disabled="!canMarkAll"
          :aria-busy="panel.markAllBusy.value ? 'true' : undefined"
          data-testid="notification-mark-all"
          @click="panel.markAllRead()"
        >
          {{ notificationText('notifications.panel.markAll') }}
        </UiButton>
        <UiIconButton
          v-if="narrow"
          icon="close"
          :label="notificationText('notifications.panel.close')"
          data-testid="notification-close"
          @click="emit('close')"
        />
      </div>
    </header>
    <UiTabs
      v-model="tabModel"
      class="nb-tabs"
      :options="tabs"
      :label="notificationText('notifications.panel.tabsLabel')"
    >
      <div class="nb-body" :aria-busy="panel.state.value === 'loading' ? 'true' : undefined">
        <div
          v-if="panel.state.value === 'loading'"
          class="nb-skel"
          data-testid="notification-loading"
        >
          <span v-for="n in 4" :key="n" class="nb-skel__row" />
          <span class="rp-sr">{{ notificationText('notifications.panel.loading') }}</span>
        </div>
        <UiErrorState
          v-else-if="panel.state.value === 'error'"
          :error="listError"
          :title="notificationText('notifications.panel.error')"
          retryable
          @retry="panel.retry()"
        />
        <UiEmptyState
          v-else-if="panel.state.value === 'empty'"
          icon="bell"
          :title="
            notificationText(
              panel.tab.value === 'unread'
                ? 'notifications.panel.emptyUnread'
                : 'notifications.panel.emptyAll',
            )
          "
        />
        <template v-else>
          <section v-for="g in panel.groups.value" :key="g.group" class="nb-group">
            <h4 class="nb-grp">{{ notificationText(GROUP_LABEL[g.group]) }}</h4>
            <ul class="nb-list" :aria-label="notificationText('notifications.panel.listLabel')">
              <NotificationRow
                v-for="item in g.items"
                :key="item.id"
                :item="item"
                :group="g.group"
                :now="panel.now.value"
                :time-zone="panel.timeZone.value"
                :pending="panel.pending.value.has(item.id)"
                @activate="panel.activate(item)"
                @mark-read="panel.markOne(item.id)"
              />
            </ul>
          </section>
          <div v-if="panel.olderError.value" class="nb-more nb-more--error" role="alert">
            <span>{{ notificationText('notifications.panel.olderError') }}</span>
            <UiButton size="sm" @click="panel.loadMore()">
              {{ notificationText('notifications.panel.retry') }}
            </UiButton>
          </div>
          <div v-else-if="panel.hasMore.value" class="nb-more">
            <UiButton
              variant="ghost"
              size="sm"
              :disabled="panel.olderLoading.value"
              :aria-busy="panel.olderLoading.value ? 'true' : undefined"
              data-testid="notification-older"
              @click="panel.loadMore()"
            >
              {{ notificationText('notifications.panel.older') }}
            </UiButton>
          </div>
        </template>
        <div class="nb-push"><PushOptInCard /></div>
      </div>
    </UiTabs>
  </section>
</template>
