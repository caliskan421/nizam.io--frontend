<script setup lang="ts">
/**
 * Bildirim paneli (E-14-09…24; 1b–1d). Zile hizalı açılır panel, `role="dialog"`; geniş ekranda
 * modal DEĞİL (odak tuzağı yok, Tab panelden çıkar), dar ekranda (≤ `--rp-narrow-max`, P62) tam
 * ekran modal: `aria-modal`, odak tuzağı, kaydırma kilidi. Kapanış: Esc, ✕, dış tık (`close`
 * olayı); odak her kapanışta zile (yoksa önceki odağa) döner (KESİN 27). Kapsam/oturum değişince
 * `close` yayılır. Liste yalnız AÇIKKEN okunur; sekme süzgeçleri sunucudadır (BE-144/145).
 * Web Push kutusu yuvası (`PushOptInCard`, W159 gövdesi) listenin sonundadır.
 */
import './notifications.css'
import './notifications-rows.css'

import { computed, nextTick, ref } from 'vue'

import { RevertReasonDialog } from '@/modules/work/public'
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
import type { NotificationTarget } from '../model/target'
import type { NotificationItem } from '../model/types'
import MutesView from './MutesView.vue'
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

const tabs = computed<UiChoiceOption<PanelTab>[]>(() => [
  {
    value: 'awaiting',
    label: notificationText('notifications.panel.tabAwaiting'),
    ...(panel.awaitingCount.value === null ? {} : { count: panel.awaitingCount.value }),
  },
  { value: 'all', label: notificationText('notifications.panel.tabAll') },
  {
    value: 'unread',
    label: notificationText('notifications.panel.tabUnread'),
    ...(panel.unreadCount.value === null ? {} : { count: panel.unreadCount.value }),
  },
])
const EMPTY_TEXT = {
  awaiting: 'notifications.panel.emptyAwaiting',
  unread: 'notifications.panel.emptyUnread',
  all: 'notifications.panel.emptyAll',
} as const
// "Reddet" (görev onayı = iade): isteğe bağlı gerekçe penceresi; tarih talebi doğrudan reddedilir.
const returning = ref<NotificationItem | null>(null)
const returnOpen = computed({
  get: () => returning.value !== null,
  set: (open: boolean) => {
    if (!open) returning.value = null
  },
})
function reject(item: NotificationItem): void {
  if (item.action?.kind === 'approve_task') returning.value = item
  else void panel.decide(item, 'reject')
}
async function submitReturn(reason: string): Promise<void> {
  const item = returning.value
  if (!item) return
  await panel.decide(item, 'reject', reason.trim() || undefined)
  returning.value = null
}
async function backFromMutes(): Promise<void> {
  panel.view.value = 'list'
  await nextTick()
  root.value?.querySelector<HTMLElement>('[data-testid="notification-mutes-open"]')?.focus()
}
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
    <MutesView
      v-if="panel.view.value === 'mutes'"
      :open="open"
      :rows="panel.rows.value"
      :time-zone="panel.timeZone.value"
      @back="backFromMutes"
    />
    <UiTabs
      v-else
      v-model="panel.tab.value"
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
          :title="notificationText(EMPTY_TEXT[panel.tab.value])"
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
                :deciding="panel.deciding.value === item.id"
                :me="panel.me.value"
                @activate="panel.activate(item)"
                @mark-read="panel.markOne(item.id)"
                @dismiss="panel.dismiss(item.id)"
                @toggle-mute="panel.toggleMute(item)"
                @approve="panel.decide(item, 'approve')"
                @reject="reject(item)"
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
        <div class="nb-mutes-link">
          <UiButton
            variant="ghost"
            size="sm"
            data-testid="notification-mutes-open"
            @click="panel.view.value = 'mutes'"
          >
            {{ notificationText('notifications.panel.mutesOpen') }}
          </UiButton>
        </div>
        <div class="nb-push"><PushOptInCard /></div>
      </div>
    </UiTabs>
    <RevertReasonDialog
      v-model:open="returnOpen"
      variant="return"
      :pending="panel.deciding.value !== null"
      @submit="submitReturn"
    />
  </section>
</template>
