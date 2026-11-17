<script setup lang="ts">
/**
 * "Sessize alınan konular" alt görünümü (P86; yeni sayfa/artboard yok): panelin içinde, ortak liste/
 * durum bileşenleriyle. Geri düğmesi listeye döner (odak tetikleyiciye döner: üst bileşen).
 */
import { computed, onMounted, ref } from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import { UiButton, UiEmptyState, UiErrorState, UiIcon, UiIconButton } from '@/shared/ui'

import { notificationText } from '../messages'
import type { NotificationItem } from '../model/types'
import { fullTime } from './panel-time'
import { muteKey, useMutesView } from './use-mutes-view'

const props = defineProps<{
  /** Bildirim paneli açık mı (sorgu yalnız açıkken okunur). */
  open: boolean
  /** Panelin mevcut bildirim verisi: güncel konu başlığı için tek kaynak. */
  rows: readonly NotificationItem[]
  timeZone: string | undefined
}>()
const emit = defineEmits<{ back: [] }>()

const view = useMutesView(
  () => props.open,
  () => props.rows,
)
const root = ref<HTMLElement | null>(null)
// Görünüm açılınca odak geri düğmesine gelir (KESİN 27); kapanışta tetikleyiciye üst bileşen döner.
onMounted(() =>
  root.value?.querySelector<HTMLElement>('[data-testid="notification-mutes-back"]')?.focus(),
)

const state = computed(() => {
  if (view.query.data.value === undefined) return view.query.isError.value ? 'error' : 'loading'
  return view.items.value.length === 0 && !view.query.hasNextPage.value ? 'empty' : 'list'
})
const label = (m: (typeof view.items.value)[number]) =>
  view.titles.value.get(muteKey(m)) ??
  notificationText(
    m.subject_kind === 'meeting' ? 'notifications.mutes.meeting' : 'notifications.mutes.workItem',
  )
</script>

<template>
  <div ref="root" class="nb-sub" data-testid="notification-mutes">
    <div class="nb-sub__bar">
      <UiIconButton
        icon="back"
        :label="notificationText('notifications.mutes.back')"
        data-testid="notification-mutes-back"
        @click="emit('back')"
      />
      <h4>{{ notificationText('notifications.mutes.title') }}</h4>
    </div>
    <div class="nb-body" :aria-busy="state === 'loading' ? 'true' : undefined">
      <div v-if="state === 'loading'" class="nb-skel">
        <span v-for="n in 3" :key="n" class="nb-skel__row" />
        <span class="rp-sr">{{ notificationText('notifications.mutes.loading') }}</span>
      </div>
      <UiErrorState
        v-else-if="state === 'error'"
        :error="toApiError(view.query.error.value)"
        :title="notificationText('notifications.mutes.error')"
        retryable
        @retry="view.retry()"
      />
      <UiEmptyState
        v-else-if="state === 'empty'"
        icon="bell-off"
        :title="notificationText('notifications.mutes.empty')"
      />
      <template v-else>
        <ul class="nb-mutes" :aria-label="notificationText('notifications.mutes.listLabel')">
          <li
            v-for="m in view.items.value"
            :key="muteKey(m)"
            class="nb-mute"
            data-testid="notification-mute-row"
          >
            <UiIcon name="bell-off" size="sm" />
            <span class="nb-mute__tx">
              <span class="nb-mute__title">{{ label(m) }}</span>
              <span class="nb-mute__date">
                {{
                  notificationText('notifications.mutes.since', {
                    date: fullTime(m.created_at, timeZone),
                  })
                }}
              </span>
            </span>
            <UiButton
              size="sm"
              :disabled="view.pending.value.has(muteKey(m))"
              :aria-busy="view.pending.value.has(muteKey(m)) ? 'true' : undefined"
              data-testid="notification-unmute"
              @click="view.remove(m)"
            >
              {{ notificationText('notifications.mutes.unmute') }}
            </UiButton>
          </li>
        </ul>
        <div
          v-if="view.query.isFetchNextPageError.value"
          class="nb-more nb-more--error"
          role="alert"
        >
          <span>{{ notificationText('notifications.mutes.olderError') }}</span>
          <UiButton size="sm" @click="view.loadMore()">
            {{ notificationText('notifications.panel.retry') }}
          </UiButton>
        </div>
        <div v-else-if="view.query.hasNextPage.value" class="nb-more">
          <UiButton
            variant="ghost"
            size="sm"
            :disabled="view.query.isFetchingNextPage.value"
            data-testid="notification-mutes-older"
            @click="view.loadMore()"
          >
            {{ notificationText('notifications.mutes.older') }}
          </UiButton>
        </div>
      </template>
    </div>
  </div>
</template>
