<script setup lang="ts">
/**
 * Bildirim satırı (E-14-25…48; P57 sade liste). Cümle `type` sözlüğü + aktör/konu/detay/grup
 * kapalı kodlarından kurulur (`model/sentence.ts`, ADR-0048); `forbidden`/`unknown` konuda başlık
 * yok. Satır tek birincil odak noktasıdır (Enter/Space); "İncele"/"Gündemi aç", satır içi karar ve
 * hover şeridi ayrı odak durağıdır. Hedefi olmayan satır (membership, bilinmeyen kind) yalnız
 * okundu işaretler (E-14-45). Birleşik grupta yığın avatar (≤5) ve kayıt sayısı gösterilir.
 */
import { computed } from 'vue'

import { UiAvatar, UiButton, UiIcon } from '@/shared/ui'

import { notificationText } from '../messages'
import { describeNotification } from '../model/dictionary'
import { describeRow } from '../model/sentence'
import { notificationTarget } from '../model/target'
import type { NotificationItem } from '../model/types'
import { fullTime, rowTime, type PanelGroup } from './panel-time'
import RowActions from './RowActions.vue'
import RowDecision from './RowDecision.vue'

const props = defineProps<{
  item: NotificationItem
  group: PanelGroup
  now: Date
  timeZone: string | undefined
  /** Bu satırın yazması (okundu/kaldır/sessize al) sürüyor. */
  pending: boolean
  /** Bu satırın kararı gönderiliyor. */
  deciding: boolean
  /** Oturum hesabı: karar sahibi "sen" mi. */
  me: string | null
}>()
const emit = defineEmits<{
  /** Satır, "İncele" ya da "Gündemi aç": okundu + hedefe gezinme. */
  activate: []
  markRead: []
  dismiss: []
  toggleMute: []
  approve: []
  reject: []
}>()

const entry = computed(() => describeNotification(props.item).entry)
const sentence = computed(() =>
  describeRow(props.item, {
    now: props.now,
    fullTime: (iso) => fullTime(iso, props.timeZone),
  }),
)
const navigable = computed(() => notificationTarget(props.item) !== null)
const time = computed(() => rowTime(props.item.created_at, props.now, props.timeZone, props.group))
const title = computed(() => fullTime(props.item.created_at, props.timeZone))
const unread = computed(() => !props.item.is_read)
const hasActs = computed(() => entry.value.action !== null || props.item.action !== null)
</script>

<template>
  <li
    class="nb-it"
    :data-unread="unread ? 'true' : 'false'"
    :data-navigable="navigable ? 'true' : 'false'"
    :aria-busy="pending || deciding ? 'true' : undefined"
    data-testid="notification-row"
  >
    <button type="button" class="nb-it__main" @click="emit('activate')">
      <span v-if="sentence.avatars.length > 0" class="nb-stack" data-testid="notification-stack">
        <UiAvatar v-for="name in sentence.avatars" :key="name" :name="name" size="sm" />
      </span>
      <span v-else class="nb-ic" :class="`nb-tone--${entry.tone}`" aria-hidden="true">
        <UiIcon :name="entry.icon" size="sm" />
      </span>
      <span class="nb-tx">
        <span class="nb-tx__text">{{ sentence.text }}</span>
        <span v-if="sentence.subject" class="nb-tx__sub" data-testid="notification-subject">
          {{ sentence.subject }}
        </span>
        <span v-if="sentence.detail" class="nb-tx__sub">{{ sentence.detail }}</span>
        <span class="nb-meta">
          {{ sentence.label }}
          <template v-if="sentence.groupCount">
            <i aria-hidden="true">·</i>
            {{ notificationText('notifications.rows.groupCount', { n: sentence.groupCount }) }}
          </template>
          <i aria-hidden="true">·</i>
          <time :datetime="item.created_at" :title="title">{{ time }}</time>
          <template v-if="item.muted">
            <i aria-hidden="true">·</i>
            {{ notificationText('notifications.rows.mutedBadge') }}
          </template>
        </span>
      </span>
      <span
        v-if="unread"
        class="nb-un"
        role="img"
        :aria-label="notificationText('notifications.rows.unreadDot')"
      />
    </button>
    <div v-if="hasActs" class="nb-acts">
      <UiButton v-if="entry.action" size="sm" @click="emit('activate')">
        {{
          notificationText(
            entry.action === 'review' ? 'notifications.rows.review' : 'notifications.rows.agenda',
          )
        }}
      </UiButton>
      <RowDecision
        :item="item"
        :busy="deciding"
        :me="me"
        @approve="emit('approve')"
        @reject="emit('reject')"
      />
    </div>
    <RowActions
      :item="item"
      :pending="pending"
      @mark-read="emit('markRead')"
      @toggle-mute="emit('toggleMute')"
      @dismiss="emit('dismiss')"
    />
  </li>
</template>
